/**
 * Debug Foreign Key Constraint Issue
 * 
 * This script helps diagnose why messages.conversation_id foreign key constraint fails
 */

import { createClient } from '@/lib/supabase/client';

async function debugFKConstraint() {
  const supabase = createClient();
  
  console.log('='.repeat(80));
  console.log('DEBUGGING FOREIGN KEY CONSTRAINT ISSUE');
  console.log('='.repeat(80));
  console.log('');

  // 1. Check authentication
  console.log('1. Checking Authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Not authenticated:', authError?.message);
    return;
  }
  
  console.log('✅ Authenticated as:', user.id);
  console.log('   Email:', user.email);
  console.log('');

  // 2. Check RLS status
  console.log('2. Checking RLS Status...');
  try {
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status' as any);
    
    if (rlsError) {
      console.log('⚠️  Could not check RLS status (function may not exist)');
    } else {
      console.log('RLS Status:', rlsStatus || 'Unknown');
    }
  } catch (e) {
    console.log('⚠️  Could not check RLS status (function may not exist)');
  }
  console.log('');

  // 3. List all conversations for this user
  console.log('3. Listing All Conversations...');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, title, user_id, created_at, message_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as any;
  
  if (convError) {
    console.error('❌ Error fetching conversations:', convError.message);
  } else if (!conversations || conversations.length === 0) {
    console.log('⚠️  No conversations found for this user');
  } else {
    console.log(`✅ Found ${conversations.length} conversation(s):`);
    conversations.forEach((conv: any, idx: number) => {
      console.log(`   ${idx + 1}. ID: ${conv.id}`);
      console.log(`      Title: ${conv.title}`);
      console.log(`      Messages: ${conv.message_count}`);
      console.log(`      Created: ${conv.created_at}`);
    });
  }
  console.log('');

  // 4. Try to create a test conversation
  console.log('4. Creating Test Conversation...');
  const testTitle = `Test Conversation ${Date.now()}`;
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: testTitle,
      session_id: `test_${Date.now()}`,
      language: 'en',
      model: 'openai/gpt-4o-mini'
    } as any)
    .select()
    .single() as any;
  
  if (createError || !newConv) {
    console.error('❌ Error creating conversation:', createError?.message);
    console.error('   Details:', createError);
    return;
  }
  
  console.log('✅ Test conversation created:', newConv.id);
  console.log('');

  // 5. Verify the conversation exists
  console.log('5. Verifying Conversation Exists...');
  const { data: verifyConv, error: verifyError } = await supabase
    .from('conversations')
    .select('id, title, user_id')
    .eq('id', newConv.id)
    .maybeSingle() as any;
  
  if (verifyError) {
    console.error('❌ Error verifying conversation:', verifyError.message);
  } else if (!verifyConv) {
    console.error('❌ Conversation not found after creation!');
  } else {
    console.log('✅ Conversation verified:', verifyConv.id);
  }
  console.log('');

  // 6. Try to add a message to the test conversation
  console.log('6. Adding Test Message...');
  const { data: newMessage, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: newConv.id,
      role: 'user',
      content: 'Test message to verify FK constraint'
    } as any)
    .select()
    .single() as any;
  
  if (messageError) {
    console.error('❌ Error adding message:', messageError.message);
    console.error('   Code:', messageError.code);
    console.error('   Details:', messageError.details);
    console.error('   Hint:', messageError.hint);
    console.log('');
    console.log('🔍 DIAGNOSIS:');
    console.log('   The foreign key constraint is failing.');
    console.log('   Possible causes:');
    console.log('   1. RLS policies are blocking the SELECT on conversations');
    console.log('   2. The conversation_id type mismatch (UUID vs TEXT)');
    console.log('   3. Database trigger or constraint issue');
    console.log('   4. Transaction isolation issue');
  } else {
    console.log('✅ Message added successfully:', newMessage.id);
  }
  console.log('');

  // 7. Check foreign key constraint details
  console.log('7. Checking Foreign Key Constraint...');
  try {
    const { data: fkInfo, error: fkError } = await supabase
      .rpc('get_fk_info' as any);
    
    if (fkError || !fkInfo) {
      console.log('⚠️  Could not fetch FK info (function may not exist)');
    } else {
      console.log('FK Constraint Info:', fkInfo);
    }
  } catch (e) {
    console.log('⚠️  Could not fetch FK info (function may not exist)');
  }
  console.log('');

  // 8. Cleanup - delete test conversation
  console.log('8. Cleaning Up Test Data...');
  const { error: deleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', newConv.id) as any;
  
  if (deleteError) {
    console.error('❌ Error deleting test conversation:', deleteError.message);
  } else {
    console.log('✅ Test conversation deleted');
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
  debugFKConstraint()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { debugFKConstraint };
