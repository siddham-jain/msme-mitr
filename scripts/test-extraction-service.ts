/**
 * Test Extraction Service
 * 
 * This script tests the extraction service with real conversations
 * from the database to verify it's working correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-extraction-service.ts [conversationId]
 * 
 * If no conversationId is provided, it will test with the most recent conversation.
 */

// Load environment variables from .env.local and .env
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import { ExtractionService } from '@/services/analytics/extractionService';
import type { Database } from '@/types/database';

async function testExtractionService(conversationId?: string) {
  console.log('🧪 Testing Extraction Service\n');
  console.log('='.repeat(60));

  // Create Supabase client with service role key for script usage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('  - SUPABASE_SECRET_KEY');
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Find a conversation to test
    let testConversationId = conversationId;

    if (!testConversationId) {
      console.log('\n📋 Finding a recent conversation to test...');

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, user_id, message_count, created_at')
        .gte('message_count', 3) // At least 3 messages
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !conversations || conversations.length === 0) {
        console.error('❌ No conversations found:', error);
        return;
      }

      const firstConv = conversations[0] as any;
      testConversationId = firstConv.id;
      console.log(`✅ Found conversation: ${testConversationId}`);
      console.log(`   Messages: ${firstConv.message_count}`);
      console.log(`   Created: ${new Date(firstConv.created_at).toLocaleString()}`);
    }

    // Step 2: Load conversation messages
    console.log('\n📨 Loading conversation messages...');

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', testConversationId!)
      .order('created_at', { ascending: true });

    if (msgError || !messages) {
      console.error('❌ Failed to load messages:', msgError);
      return;
    }

    console.log(`✅ Loaded ${messages.length} messages`);
    console.log('\n💬 Conversation Preview:');
    console.log('-'.repeat(60));

    messages.slice(0, 5).forEach((msg: any, idx: number) => {
      const preview = msg.content.substring(0, 80);
      console.log(`${idx + 1}. [${msg.role}]: ${preview}${msg.content.length > 80 ? '...' : ''}`);
    });

    if (messages.length > 5) {
      console.log(`   ... and ${messages.length - 5} more messages`);
    }

    // Step 3: Check if extraction already exists
    console.log('\n🔍 Checking for existing extraction...');

    const { data: existingAttributes } = await supabase
      .from('user_attributes')
      .select('*')
      .eq('conversation_id', testConversationId!)
      .maybeSingle();

    if (existingAttributes) {
      const attrs = existingAttributes as any;
      console.log('✅ Found existing extraction:');
      console.log(`   Location: ${attrs.location || 'N/A'}`);
      console.log(`   Industry: ${attrs.industry || 'N/A'}`);
      console.log(`   Business Size: ${attrs.business_size || 'N/A'}`);
      console.log(`   Employee Count: ${attrs.employee_count || 'N/A'}`);
      console.log(`   Confidence: ${attrs.extraction_confidence || 'N/A'}`);
      console.log(`   Languages: ${attrs.detected_languages?.join(', ') || 'N/A'}`);
    } else {
      console.log('ℹ️  No existing extraction found');
    }

    // Step 4: Perform extraction
    console.log('\n🤖 Running extraction service...');
    console.log('⏳ This may take 10-30 seconds...\n');

    const extractionService = new ExtractionService(supabase);
    const startTime = Date.now();

    const result = await extractionService.extractFromConversation(testConversationId!);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Step 5: Display results
    console.log('='.repeat(60));
    console.log('✅ EXTRACTION COMPLETED');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}s\n`);

    console.log('📊 Extracted Attributes:');
    console.log('-'.repeat(60));
    console.log(`Location:        ${result.attributes.location || 'Not detected'}`);
    console.log(`Industry:        ${result.attributes.industry || 'Not detected'}`);
    console.log(`Business Size:   ${result.attributes.businessSize || 'Not detected'}`);
    console.log(`Annual Turnover: ${result.attributes.annualTurnover ? `₹${result.attributes.annualTurnover.toLocaleString()}` : 'Not detected'}`);
    console.log(`Employee Count:  ${result.attributes.employeeCount || 'Not detected'}`);

    console.log('\n🎯 Scheme Interests:');
    console.log('-'.repeat(60));
    if (result.schemeInterests.length > 0) {
      result.schemeInterests.forEach((interest, idx) => {
        console.log(`${idx + 1}. ${interest.schemeName} (${interest.interestLevel})`);
      });
    } else {
      console.log('No scheme interests detected');
    }

    console.log('\n📈 Metadata:');
    console.log('-'.repeat(60));
    console.log(`Confidence:      ${(result.metadata.confidence * 100).toFixed(1)}%`);
    console.log(`Languages:       ${result.metadata.detectedLanguages.join(', ')}`);
    console.log(`Notes:           ${result.metadata.extractionNotes}`);

    if (result.metadata.originalLanguageData) {
      console.log('\n🌐 Original Language Data:');
      console.log(JSON.stringify(result.metadata.originalLanguageData, null, 2));
    }

    // Step 6: Test storage (optional - only if confidence is high enough)
    const confidenceThreshold = parseFloat(process.env.EXTRACTION_CONFIDENCE_THRESHOLD || '0.5');

    if (result.metadata.confidence >= confidenceThreshold) {
      console.log('\n💾 Testing storage...');

      // Get user_id from conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('user_id')
        .eq('id', testConversationId!)
        .single();

      if (conv) {
        const convData = conv as any;
        if (convData.user_id) {
          // Create a test job ID
          const testJobId = `test-${Date.now()}`;

          try {
            await extractionService.storeExtractionResults(
              testConversationId!,
              convData.user_id as string,
              result,
              testJobId
            );
            console.log('✅ Storage test successful');
          } catch (storageError) {
            console.error('⚠️  Storage test failed:', storageError);
          }
        }
      }
    } else {
      console.log(`\n⚠️  Confidence ${(result.metadata.confidence * 100).toFixed(1)}% below threshold ${(confidenceThreshold * 100).toFixed(1)}%`);
      console.log('   Results would not be stored in production');
    }

    // Step 7: Verify stored data
    console.log('\n🔍 Verifying stored data...');

    const { data: storedAttributes } = await supabase
      .from('user_attributes')
      .select('*')
      .eq('conversation_id', testConversationId!)
      .maybeSingle();

    if (storedAttributes) {
      const stored = storedAttributes as any;
      console.log('✅ Data successfully stored in database');
      console.log(`   Record ID: ${stored.id}`);
      console.log(`   Updated at: ${new Date(stored.updated_at).toLocaleString()}`);
    } else {
      console.log('ℹ️  No data stored (may be below confidence threshold)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    process.exit(1);
  }
}

// Run the test
const conversationId = process.argv[2];

if (conversationId) {
  console.log(`Testing with conversation ID: ${conversationId}\n`);
}

testExtractionService(conversationId)
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
