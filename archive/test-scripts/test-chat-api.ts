/**
 * Test script for chat API endpoint
 * Tests the full flow: user message -> AI response -> database storage
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🧪 Testing Chat API...\n')

  try {
    // 1. Get a test user
    console.log('1️⃣  Finding test user...')
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, business_name')
      .limit(1)
      .single()

    if (userError || !users) {
      console.error('❌ No users found. Please create a user first.')
      return
    }

    console.log(`   ✅ Found user: ${users.email}\n`)

    // 2. Get or create a test conversation
    console.log('2️⃣  Finding test conversation...')
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('user_id', users.id)
      .limit(1)
      .single()

    if (convError || !conversation) {
      console.log('   Creating new test conversation...')
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: users.id,
          title: 'Test Conversation - AI Integration'
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }
      conversation = newConv
    }

    console.log(`   ✅ Using conversation: ${conversation.title}\n`)

    // 3. Send a test message via API
    console.log('3️⃣  Sending test message to chat API...')
    const testMessage = "I'm a small manufacturing business in Maharashtra looking for financial assistance. Can you recommend any schemes?"

    const response = await fetch('http://localhost:3000/api/chat/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: conversation.id,
        message: testMessage,
        userId: users.id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API Error: ${errorData.error || response.statusText}`)
    }

    const data = await response.json()
    console.log('   ✅ API response received\n')

    // 4. Verify messages in database
    console.log('4️⃣  Verifying messages in database...')
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    if (msgError) {
      throw msgError
    }

    console.log(`   ✅ Found ${messages.length} messages\n`)

    // 5. Display results
    console.log('📊 RESULTS:')
    console.log('=' .repeat(80))

    messages.forEach((msg, i) => {
      const role = msg.role.toUpperCase().padEnd(10)
      const preview = msg.content.substring(0, 100).replace(/\n/g, ' ')
      console.log(`\n${i + 1}. [${role}]`)
      console.log(`   ${preview}${msg.content.length > 100 ? '...' : ''}`)
    })

    console.log('\n' + '='.repeat(80))

    // 6. Check if AI response exists
    const hasUserMessage = messages.some(m => m.role === 'user')
    const hasAssistantMessage = messages.some(m => m.role === 'assistant')

    console.log('\n✨ TEST SUMMARY:')
    console.log(`   User message saved: ${hasUserMessage ? '✅' : '❌'}`)
    console.log(`   AI response generated: ${hasAssistantMessage ? '✅' : '❌'}`)
    console.log(`   Total messages: ${messages.length}`)

    if (hasUserMessage && hasAssistantMessage) {
      console.log('\n🎉 SUCCESS! Chat API is working correctly with AI responses!\n')
    } else {
      console.log('\n⚠️  WARNING: Some messages are missing\n')
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  }
}

main()
