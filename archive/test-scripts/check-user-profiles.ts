import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, email, business_name, business_sector, business_size, state, annual_turnover, employee_count')
    .limit(5)

  console.log('User Profiles:')
  console.log(JSON.stringify(users, null, 2))
}

main()
