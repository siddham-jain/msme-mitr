/**
 * Test AI-powered scheme recommendation with detailed business info
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
  console.log('🧪 Testing AI Scheme Recommendation...\n')

  try {
    // Get test user and conversation
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .single()

    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    // Send detailed message with business information
    const detailedMessage = `My business details:
- Business Type: Small manufacturing company
- Sector: Textiles and garments
- Location: Mumbai, Maharashtra
- Annual Turnover: 3.5 crores
- Number of Employees: 25
- Looking for: Financial assistance and technology upgrades

Can you recommend suitable government schemes for my business?`

    console.log('📤 Sending detailed query...\n')

    const response = await fetch('http://localhost:3000/api/chat/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation.id,
        message: detailedMessage,
        userId: user.id
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    console.log('✅ Response received, fetching messages...\n')

    // Get latest messages
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(2)

    if (messages) {
      messages.reverse().forEach((msg, i) => {
        console.log(`\n${i + 1}. [${msg.role.toUpperCase()}]`)
        console.log('─'.repeat(80))
        console.log(msg.content)
      })
    }

    console.log('\n' + '='.repeat(80))
    console.log('✨ Test completed successfully!\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
