/**
 * Test AI with a fresh conversation
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('🧪 Testing AI with Fresh Conversation...\n')

  try {
    // Get test user
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .single()

    if (!user) {
      console.error('❌ No user found')
      return
    }

    // Create NEW conversation with session_id
    console.log('1️⃣  Creating fresh conversation...')
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'Fresh Test - Scheme Recommendations',
        session_id: sessionId
      })
      .select()
      .single()

    if (convError) {
      throw convError
    }

    console.log(`   ✅ Created: ${conversation.title}\n`)

    // Send test message
    console.log('2️⃣  Sending message about textile business...')
    const message = "I run a small textile manufacturing business in Mumbai with 25 employees and 3.5 crore annual turnover. What government schemes can help me with financial assistance and technology upgrades?"

    const response = await fetch('http://localhost:3000/api/chat/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation.id,
        message,
        userId: user.id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API error: ${errorData.error || response.statusText}`)
    }

    console.log('   ✅ Response received\n')

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    console.log('📊 CONVERSATION:')
    console.log('='.repeat(80))

    messages?.forEach((msg, i) => {
      console.log(`\n${i + 1}. [${msg.role.toUpperCase()}]`)
      console.log('─'.repeat(80))
      console.log(msg.content)
    })

    console.log('\n' + '='.repeat(80))

    const aiResponse = messages?.find(m => m.role === 'assistant')
    console.log(`\n✨ AI Response Length: ${aiResponse?.content.length || 0} characters`)
    console.log('🎉 Test completed!\n')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
