import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chatCompletion, MSME_SYSTEM_PROMPT, type Message } from '@/lib/ai/openrouter'

// Create Supabase clients
function getSupabaseClients(authToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // Client with user auth (for reading user data)
  const userClient = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    }
  )

  // Service role client (for writing messages)
  const serviceClient = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return { userClient, serviceClient }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, message, userId } = body

    if (!conversationId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, message, userId' },
        { status: 400 }
      )
    }

    // Get auth token from header
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const { userClient, serviceClient } = getSupabaseClients(authToken)

    // 1. Save user message to database
    const { data: userMessage, error: saveUserError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      })
      .select()
      .single()

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // 2. Get conversation history (last 10 messages for context)
    const { data: conversationHistory, error: historyError } = await serviceClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    if (historyError) {
      console.error('Error fetching conversation history:', historyError)
    }

    // 3. Get user profile for context
    const { data: userProfile, error: profileError } = await userClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    // 4. Build context for AI
    const userContext = userProfile ? `
User Profile:
- Business Name: ${userProfile.business_name || 'Not specified'}
- Business Sector: ${userProfile.business_sector || 'Not specified'}
- Business Size: ${userProfile.business_size || 'Not specified'}
- State: ${userProfile.state || 'Not specified'}
- Annual Turnover: ${userProfile.annual_turnover ? `₹${(userProfile.annual_turnover / 10000000).toFixed(2)} Cr` : 'Not specified'}
- Employees: ${userProfile.employee_count || 'Not specified'}
` : 'User profile not available'

    // 5. Prepare messages for AI
    const aiMessages: Message[] = [
      { role: 'system', content: MSME_SYSTEM_PROMPT },
      { role: 'system', content: userContext },
    ]

    // Add conversation history (excluding the just-added user message)
    if (conversationHistory && conversationHistory.length > 1) {
      conversationHistory.slice(0, -1).forEach((msg: any) => {
        aiMessages.push({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })
      })
    }

    // Add current user message
    aiMessages.push({
      role: 'user',
      content: message
    })

    // 6. Get AI response
    console.log('Calling OpenRouter with', aiMessages.length, 'messages')
    const aiResponse = await chatCompletion({
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 1500
    })

    console.log('Received AI response, length:', aiResponse.length)

    // 7. Save AI response to database
    const { data: assistantMessage, error: saveAssistantError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse
      })
      .select()
      .single()

    if (saveAssistantError) {
      console.error('Error saving assistant message:', saveAssistantError)
      return NextResponse.json(
        { error: 'Failed to save AI response' },
        { status: 500 }
      )
    }

    // 8. Update conversation updated_at timestamp
    await serviceClient
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // 9. Return response
    return NextResponse.json({
      message: assistantMessage,
      success: true
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process message',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
