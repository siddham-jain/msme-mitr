import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data } = await supabase
    .from('messages')
    .select('role, content')
    .order('created_at', { ascending: false })
    .limit(2)

  if (data) {
    data.reverse().forEach((msg, i) => {
      console.log(`\n${i + 1}. [${msg.role.toUpperCase()}]`)
      console.log('─'.repeat(80))
      console.log(msg.content)
    })
  }
}

main()
