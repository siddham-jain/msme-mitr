/**
 * Debug script for foreign key constraint error
 * Run this to diagnose conversation creation issues
 */

import { createClient } from '@/lib/supabase/client';

async function debugConversationFK() {
  console.log('🔍 Starting Foreign Key Constraint Debug...\n');

  const supabase = createClient();

  // Step 1: Check authentication
  console.log('1️⃣ Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Authentication failed:', authError);
    return;
  }
  
  console.log('✅ User authenticated:', user.id);
  console.log('   Email:', user.email);
  console.log('');

  // Step 2: Check RLS status
  console.log('2️⃣ Checking RLS status...');
  const { data: rlsData, error: rlsError } = await supabase
    .from('conversations')
    .select('id')
    .limit(1);
  
  if (rlsError) {
    console.error('❌ RLS check failed:', rlsError.message);
  } else {
    console.log('✅ Can query conversations table');
  }
  console.log('');

  // Step 3: Try to create a conversation
  console.log('3️⃣ Attempting to create test conversation...');
  const testConv = {
    user_id: user.id,
    title: 'Debug Test ' + new Date().toISOString(),
    session_id: `debug_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    language: 'en',
    model: 'openai/gpt-4o-mini'
  } as any;
  
  console.log('   Data:', testConv);
  
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert(testConv)
    .select()
    .single();
  
  if (convError) {
    console.error('❌ Conversation creation failed:', convError);
    console.error('   Code:', convError.code);
    console.error('   Details:', convError.details);
    console.error('   Hint:', convError.hint);
    return;
  }
  
  console.log('✅ Conversation created:', (newConv as any)?.id);
  console.log('');

  // Step 4: Verify conversation exists
  console.log('4️⃣ Verifying conversation exists...');
  const { data: verifyConv, error: verifyError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', (newConv as any)?.id)
    .single();
  
  if (verifyError) {
    console.error('❌ Conversation verification failed:', verifyError);
    return;
  }
  
  console.log('✅ Conversation verified:', (verifyConv as any)?.id);
  console.log('   Title:', (verifyConv as any)?.title);
  console.log('   User ID:', (verifyConv as any)?.user_id);
  console.log('');

  // Step 5: Try to add a message
  console.log('5️⃣ Attempting to add test message...');
  const testMsg = {
    conversation_id: (newConv as any)?.id,
    role: 'user' as const,
    content: 'Debug test message'
  } as any;
  
  console.log('   Data:', testMsg);
  
  const { data: newMsg, error: msgError } = await supabase
    .from('messages')
    .insert(testMsg)
    .select()
    .single();
  
  if (msgError) {
    console.error('❌ Message creation failed:', msgError);
    console.error('   Code:', msgError.code);
    console.error('   Details:', msgError.details);
    console.error('   Hint:', msgError.hint);
    
    // Additional debugging
    console.log('\n🔍 Additional debugging:');
    console.log('   Conversation ID type:', typeof (newConv as any)?.id);
    console.log('   Conversation ID value:', (newConv as any)?.id);
    
    // Check if conversation still exists
    const { data: recheckConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', (newConv as any)?.id)
      .single();
    
    console.log('   Conversation still exists:', !!recheckConv);
    
    return;
  }
  
  console.log('✅ Message created:', (newMsg as any)?.id);
  console.log('   Content:', (newMsg as any)?.content);
  console.log('');

  // Step 6: Cleanup
  console.log('6️⃣ Cleaning up test data...');
  await supabase.from('messages').delete().eq('id', (newMsg as any)?.id);
  await supabase.from('conversations').delete().eq('id', (newConv as any)?.id);
  console.log('✅ Cleanup complete');
  console.log('');

  console.log('✅ All tests passed! No foreign key constraint issues detected.');
}

// Run if executed directly
if (typeof window !== 'undefined') {
  (window as any).debugConversationFK = debugConversationFK;
  console.log('Debug function loaded. Run: debugConversationFK()');
}

export { debugConversationFK };
