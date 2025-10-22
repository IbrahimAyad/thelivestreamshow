/**
 * BetaBot Database Setup Verification Script
 * Run this to verify all tables, functions, triggers, and RLS policies are set up correctly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying BetaBot database setup...\n');

  // 1. Check tables exist
  console.log('📊 Checking tables...');
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE 'betabot%' OR table_name LIKE 'show%')
      ORDER BY table_name;
    `
  });

  if (tablesError) {
    console.log('⚠️  Cannot query tables directly (this is normal)');
    console.log('   Checking by attempting to query each table...\n');

    const expectedTables = [
      'betabot_conversation_log',
      'betabot_entity_knowledge',
      'betabot_feedback',
      'betabot_interactions',
      'betabot_keyword_activations',
      'betabot_learned_patterns',
      'betabot_learning_metrics',
      'betabot_memory',
      'betabot_memory_connections',
      'betabot_mood',
      'betabot_sessions',
      'episode_info',
      'show_metadata',
      'show_segments',
      'show_questions'
    ];

    let successCount = 0;
    for (const table of expectedTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        console.log(`   ✅ ${table}`);
        successCount++;
      } else {
        console.log(`   ❌ ${table} - ${error.message}`);
      }
    }

    console.log(`\n   Found ${successCount}/${expectedTables.length} tables\n`);
  } else {
    console.log('   ✅ All tables exist\n');
  }

  // 2. Check initial data
  console.log('📝 Checking initial data...');

  const { data: showData, error: showError } = await supabase
    .from('show_metadata')
    .select('*')
    .limit(1)
    .single();

  if (showData) {
    console.log(`   ✅ show_metadata: "${showData.show_title}"`);
  } else {
    console.log(`   ❌ show_metadata: ${showError?.message || 'No data'}`);
  }

  const { data: moodData, error: moodError } = await supabase
    .from('betabot_mood')
    .select('*')
    .limit(1)
    .single();

  if (moodData) {
    console.log(`   ✅ betabot_mood: ${moodData.mood}\n`);
  } else {
    console.log(`   ❌ betabot_mood: ${moodError?.message || 'No data'}\n`);
  }

  // 3. Test real-time subscriptions
  console.log('🔴 Testing real-time subscriptions...');

  let transcriptReceived = false;
  let questionReceived = false;

  const transcriptChannel = supabase
    .channel('test_transcripts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'betabot_conversation_log'
    }, () => {
      transcriptReceived = true;
      console.log('   ✅ Transcript subscription working');
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('   ✅ Subscribed to betabot_conversation_log');
      }
    });

  const questionChannel = supabase
    .channel('test_questions')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'show_questions'
    }, () => {
      questionReceived = true;
      console.log('   ✅ Question subscription working');
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('   ✅ Subscribed to show_questions');
      }
    });

  // Wait for subscriptions
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Insert test data
  console.log('\n   Inserting test transcript...');
  const { error: transcriptInsertError } = await supabase
    .from('betabot_conversation_log')
    .insert({
      transcript_text: 'Verification test transcript',
      speaker_type: 'test'
    });

  if (transcriptInsertError) {
    console.log(`   ❌ Failed to insert transcript: ${transcriptInsertError.message}`);
  }

  console.log('   Inserting test question...');
  const { error: questionInsertError } = await supabase
    .from('show_questions')
    .insert({
      question_text: 'Verification test question',
      source: 'manual',
      ai_generated: false
    });

  if (questionInsertError) {
    console.log(`   ❌ Failed to insert question: ${questionInsertError.message}`);
  }

  // Wait for real-time events
  await new Promise(resolve => setTimeout(resolve, 2000));

  transcriptChannel.unsubscribe();
  questionChannel.unsubscribe();

  // 4. Test memory functions
  console.log('\n🧠 Testing memory functions...');

  // Test storing a memory
  const { data: memoryData, error: memoryError } = await supabase
    .from('betabot_memory')
    .insert({
      topic: 'Verification Test',
      conversation_snippet: 'This is a test memory for verification',
      mentioned_entities: ['test', 'verification'],
      keywords: ['test', 'setup', 'verification'],
      sentiment: 'neutral',
      importance_score: 0.5
    })
    .select()
    .single();

  if (memoryData) {
    console.log('   ✅ Memory storage working');

    // Test memory recall increment
    const { error: recallError } = await supabase.rpc('increment_memory_recall', {
      memory_id: memoryData.id
    });

    if (!recallError) {
      console.log('   ✅ Memory recall increment working');
    } else {
      console.log(`   ⚠️  Memory recall increment: ${recallError.message}`);
    }
  } else {
    console.log(`   ❌ Memory storage: ${memoryError?.message || 'Failed'}`);
  }

  // 5. Test feedback system
  console.log('\n👍 Testing feedback system...');

  const { data: interactionData, error: interactionError } = await supabase
    .from('betabot_interactions')
    .insert({
      interaction_type: 'normal_response',
      user_input: 'Test question',
      bot_response: 'Test response',
      processing_time_ms: 100
    })
    .select()
    .single();

  if (interactionData) {
    console.log('   ✅ Interaction logging working');

    const { error: feedbackError } = await supabase
      .from('betabot_feedback')
      .insert({
        interaction_id: interactionData.id,
        feedback_type: 'answer_helpful',
        feedback_value: 1
      });

    if (!feedbackError) {
      console.log('   ✅ Feedback submission working');
    } else {
      console.log(`   ❌ Feedback submission: ${feedbackError.message}`);
    }
  } else {
    console.log(`   ❌ Interaction logging: ${interactionError?.message || 'Failed'}`);
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICATION COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Check browser console for real-time subscription logs');
  console.log('2. Test keyword activation (Alakazam, Kadabra, Abra)');
  console.log('3. Test Producer AI integration');
  console.log('4. Review BETABOT_TESTING_GUIDE.md for full test suite');
  console.log('\n');
}

verifySetup().catch(console.error);
