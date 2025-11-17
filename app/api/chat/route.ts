import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { conversationManager } from '@/services/chat/conversationManager';
import { schemeDataService } from '@/services/schemes/schemeDataService';
import { extractionTriggerService } from '@/services/analytics/extractionTriggerService';

// Edge runtime for streaming
export const runtime = 'edge';

// Configure OpenRouter using the official provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Extract text content from various message formats
 * Handles AI SDK v5 formats, parts array, content array, and plain text
 */
function extractMessageContent(message: any): string {
  if (!message) return '';

  // Format 1: Direct string content
  if (typeof message.content === 'string') {
    return message.content;
  }

  // Format 2: Text field (fallback)
  if (typeof message.text === 'string') {
    return message.text;
  }

  // Format 3: AI SDK v5 parts array format (useChat sends this)
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p && (p.type === 'text' || p.text))
      .map((p: any) => p.text || '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // Format 4: Content array format (AI SDK response format)
  if (message.content && Array.isArray(message.content)) {
    return message.content
      .filter((c: any) => c && (c.type === 'text' || c.type === 'output_text' || c.type === 'input_text'))
      .map((c: any) => c.text || c.content || '')
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Chat API] Received request');
    console.log('[Chat API] Body keys:', Object.keys(body));
    console.log('[Chat API] Messages type:', typeof body.messages, 'Array?', Array.isArray(body.messages));
    console.log('[Chat API] Messages length:', body.messages?.length);
    
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      console.log('[Chat API] Full body:', JSON.stringify(body, null, 2));
    }

    // AI SDK v5 sends messages array directly as UIMessage[]
    let uiMessages: UIMessage[] = body.messages || [];
    const { sessionId, language = 'en', userProfile, model, conversationId } = body;
    
    // Log the first message structure for debugging
    if (uiMessages.length > 0) {
      console.log('[Chat API] First message structure:', JSON.stringify(uiMessages[0], null, 2));
    }

    // If we have a conversationId, load full conversation history from database
    if (conversationId) {
      console.log('[Chat API] Loading conversation history for:', conversationId);
      console.log('[Chat API] Client sent', uiMessages.length, 'messages');
      
      try {
        // Import MessageService to load messages
        const { MessageService } = await import('@/services/database/messageService');
        const { createClient } = await import('@/lib/supabase/server');
        
        const supabase = await createClient();
        const messageService = new MessageService(supabase);
        
        // Load all messages from database
        const dbMessages = await messageService.getMessages(conversationId);
        console.log('[Chat API] Loaded', dbMessages.length, 'messages from database');
        
        // Convert database messages to UIMessage format
        const historyMessages: UIMessage[] = dbMessages
          .filter((msg: any) => {
            // Skip messages with no content
            if (!msg.content || (typeof msg.content === 'string' && msg.content.trim().length === 0)) {
              console.warn('[Chat API] Skipping DB message with no content:', msg.id);
              return false;
            }
            return true;
          })
          .map((msg: any) => {
            let content = msg.content;
            
            // If content is an array, extract text from it
            if (Array.isArray(content)) {
              content = content
                .filter((c: any) => c && (c.type === 'text' || c.text))
                .map((c: any) => c.text || c.content || '')
                .filter(Boolean)
                .join(' ')
                .trim();
            }
            
            // Ensure content is a string
            if (typeof content !== 'string') {
              content = String(content || '');
            }
            
            // Return UIMessage format with parts array
            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              parts: [{ type: 'text' as const, text: content }],
              createdAt: new Date(msg.created_at),
            } as UIMessage;
          });
        
        // Get the last message from the client (the new user message)
        const lastClientMessage = uiMessages.length > 0 ? uiMessages[uiMessages.length - 1] : null;
        
        if (lastClientMessage) {
          // Combine: history + new message
          uiMessages = [...historyMessages, lastClientMessage];
          console.log('[Chat API] Combined history (', historyMessages.length, ') + new message (1) = ', uiMessages.length, 'total');
        } else {
          // Just use history
          uiMessages = historyMessages;
          console.log('[Chat API] Using only history:', uiMessages.length, 'messages');
        }
      } catch (err) {
        console.error('[Chat API] Failed to load conversation history:', err);
        // Continue with client messages if database load fails
      }
    }

    // Validate messages array
    if (!Array.isArray(uiMessages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages must be an array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // Apply rate limiting
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback to mock response if not configured
      const lastMessage = uiMessages.length > 0 ? extractMessageContent(uiMessages[uiMessages.length - 1]) : '';
      return handleFallbackResponse(lastMessage, sessionId);
    }

    // Get the last user message using utility function
    const lastMsg = uiMessages[uiMessages.length - 1];
    const lastUserMessage = extractMessageContent(lastMsg);

    // Process chat with context from our data layer
    const { systemPrompt, context, session } = await conversationManager.processChat({
      message: lastUserMessage,
      sessionId,
      language,
      userProfile
    });

    // Filter out any invalid messages (like welcome messages)
    const validUIMessages = uiMessages.filter((m: UIMessage) => {
      // Skip the welcome message from the client
      if (m.id === 'welcome' && m.role === 'assistant') {
        return false;
      }
      
      // Ensure message has required fields
      if (!m || !m.role || !m.id) {
        console.warn('[Chat API] Skipping message with missing required fields:', m);
        return false;
      }
      
      // Ensure message has content (either parts array or content string)
      const hasParts = m.parts && Array.isArray(m.parts) && m.parts.length > 0;
      const hasContent = typeof (m as any).content === 'string' && (m as any).content.length > 0;
      
      if (!hasParts && !hasContent) {
        console.warn('[Chat API] Skipping message with no content:', m.id);
        return false;
      }
      
      return m.role === 'user' || m.role === 'assistant';
    });

    // Log processed messages for debugging
    console.log('[Chat API] Processing', validUIMessages.length, 'UI messages for AI');
    console.log('[Chat API] Message roles:', validUIMessages.map(m => `${m.role}:${m.id.substring(0, 8)}`).join(', '));
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      console.log('UI messages:', JSON.stringify(validUIMessages, null, 2));
    }

    // Use AI SDK v5 streamText with convertToModelMessages
    // This function handles all the message format conversions properly
    const result = streamText({
      model: openrouter.chat(model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'),
      system: systemPrompt,
      messages: convertToModelMessages(validUIMessages),
      temperature: 0.7,
      async onFinish({ text, finishReason }) {
        // Update session with the conversation
        const mentionedSchemes = extractMentionedSchemes(text, context.relevantSchemes);

        conversationManager.updateSession(
          session.id,
          lastUserMessage,
          text,
          mentionedSchemes
        );

        // Log token usage and cost estimation
        if (process.env.ENABLE_DEBUG_LOGS === 'true') {
          console.log(`Session: ${session.id}, Finish reason: ${finishReason}`);
        }

        // Trigger extraction job if conditions are met (async, non-blocking)
        if (conversationId) {
          try {
            const shouldTrigger = await extractionTriggerService.shouldTriggerExtraction(conversationId);
            if (shouldTrigger) {
              console.log('[Chat API] Triggering extraction for conversation:', conversationId);
              await extractionTriggerService.queueExtractionJob(conversationId, 'normal');
            }
          } catch (error) {
            // Log error but don't fail the chat response
            console.error('[Chat API] Failed to trigger extraction:', error);
          }
        }
      }
    });

    // Return streaming response with custom headers in UI message format
    // Pass originalMessages to ensure proper message ID tracking on the client
    return result.toUIMessageStreamResponse({
      originalMessages: validUIMessages,
      headers: {
        'X-Session-Id': session.id,
        'X-Model-Used': model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);

    // Log additional error details for debugging
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    // Determine appropriate error message and status
    let errorMessage = 'Failed to process chat request';
    let statusCode = 500;

    if (error.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.message?.includes('API key')) {
      errorMessage = 'API configuration error. Please contact support.';
      statusCode = 503;
    } else if (error.message?.includes('Invalid message') || error.message?.includes('invalid_type')) {
      errorMessage = 'Invalid message format. Please try rephrasing your question.';
      statusCode = 400;
      console.error('[Chat API] Message validation error - check message format');
    } else if (error.message?.includes('invalid_union')) {
      errorMessage = 'Message format validation failed. Please try again.';
      statusCode = 400;
      console.error('[Chat API] Zod validation error - message schema mismatch');
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
        fallback: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.status || statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Extract mentioned schemes from AI response
 */
function extractMentionedSchemes(text: string, relevantSchemes: any[]): any[] {
  const mentioned: any[] = [];

  for (const scheme of relevantSchemes) {
    const schemeName = scheme.scheme_name?.toLowerCase() || '';
    const textLower = text.toLowerCase();

    if (textLower.includes(schemeName)) {
      mentioned.push(scheme);
    }
  }

  return mentioned;
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const maxRequestsPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '20');

  const clientData = rateLimitStore.get(clientId);

  if (!clientData || clientData.resetAt < now) {
    // Create new rate limit window
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + 60000 // 1 minute window
    });
    return true;
  }

  if (clientData.count >= maxRequestsPerMinute) {
    return false;
  }

  // Increment count
  clientData.count++;
  return true;
}

/**
 * Handle fallback response when OpenRouter is not configured
 */
async function handleFallbackResponse(message: string, sessionId?: string) {
  const schemes = await schemeDataService.getAllSchemes();

  // Generate simple fallback response
  const fallbackResponse = `I apologize, but the AI service is not currently configured. However, I can tell you that we have ${schemes.length} government schemes available. To enable full AI capabilities, please configure your OPENROUTER_API_KEY environment variable.`;

  // Create a simple data stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = fallbackResponse.split(' ');
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk + ' ')}\n`));
        await new Promise(resolve => setTimeout(resolve, 30)); // Simulate streaming
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Session-Id': sessionId || 'fallback',
      'X-Fallback-Mode': 'true',
      'Cache-Control': 'no-cache',
    }
  });
}

/**
 * OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}