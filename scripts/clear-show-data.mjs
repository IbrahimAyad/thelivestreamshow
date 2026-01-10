#!/usr/bin/env node
/**
 * Clear Morning Show AI Prep and Ultra Chat Data
 * Resets the show to a clean slate for new episode preparation
 */

import { createClient } from '@supabase/supabase-js/dist/main/index.js'

const supabaseUrl = 'https://dwrdhnzqjhqmmlwnhlyu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cmRobnpxamhxbW1sd25obHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNzk0NTUsImV4cCI6MjA0NTc1NTQ1NX0.qhR0G59Ga0FtXdJ7VfvLjmSO_I9Wg-w-d8IQq7GYVjE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearShowData() {
  console.log('🧹 Starting Morning Show data cleanup...\n')

  try {
    // 1. Get the current active episode
    console.log('📋 Finding active episode...')
    const { data: activeEpisode, error: episodeError } = await supabase
      .from('episode_info')
      .select('*, episode_prep_progress(*)')
      .eq('is_active', true)
      .maybeSingle()

    if (episodeError) throw episodeError

    if (!activeEpisode) {
      console.log('⚠️  No active episode found')
      return
    }

    console.log(`✅ Found: Episode #${activeEpisode.episode_number} - ${activeEpisode.episode_title}`)
    console.log(`   Date: ${activeEpisode.episode_date}`)
    console.log(`   Status: ${activeEpisode.episode_prep_progress?.[0]?.prep_status || 'unknown'}`)
    console.log(`   Completion: ${activeEpisode.episode_prep_progress?.[0]?.prep_completion_percent || 0}%\n`)

    // 2. Clear AI-generated content
    console.log('🗑️  Clearing AI-generated content...')
    const { error: aiContentError } = await supabase
      .from('episode_ai_content')
      .delete()
      .eq('episode_info_id', activeEpisode.id)

    if (aiContentError) throw aiContentError
    console.log('   ✓ AI content cleared')

    // 3. Clear episode segments
    console.log('🗑️  Clearing episode segments...')
    const { error: segmentsError } = await supabase
      .from('episode_segments')
      .delete()
      .eq('episode_info_id', activeEpisode.id)

    if (segmentsError) throw segmentsError
    console.log('   ✓ Segments cleared')

    // 4. Clear episode scripts
    console.log('🗑️  Clearing episode scripts...')
    const { error: scriptsError } = await supabase
      .from('episode_scripts')
      .delete()
      .eq('episode_info_id', activeEpisode.id)

    if (scriptsError) throw scriptsError
    console.log('   ✓ Scripts cleared')

    // 5. Clear Ultra Chat questions (show_questions table)
    console.log('🗑️  Clearing Ultra Chat messages...')
    const { data: questions, error: questionsCountError } = await supabase
      .from('show_questions')
      .select('id')

    if (questionsCountError) throw questionsCountError

    const questionCount = questions?.length || 0

    if (questionCount > 0) {
      const { error: clearQuestionsError } = await supabase
        .from('show_questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (clearQuestionsError) throw clearQuestionsError
      console.log(`   ✓ Cleared ${questionCount} Ultra Chat messages`)
    } else {
      console.log('   ✓ No Ultra Chat messages to clear')
    }

    // 6. Reset prep progress
    console.log('🔄 Resetting prep progress...')
    const { error: progressError } = await supabase
      .from('episode_prep_progress')
      .update({
        prep_status: 'not_started',
        prep_completion_percent: 0,
        total_segments: 0,
        segments_prepared: 0,
        total_ai_content_generated: 0,
        ai_content_approved: 0,
        news_stories_generated: 0,
        news_stories_approved: 0,
        questions_generated: 0,
        questions_approved: 0,
        clip_lines_generated: 0,
        clip_lines_approved: 0
      })
      .eq('episode_info_id', activeEpisode.id)

    if (progressError) throw progressError
    console.log('   ✓ Progress reset to 0%')

    console.log('\n✨ Morning Show data cleared successfully!')
    console.log('\n📊 Summary:')
    console.log('   • AI content: Cleared')
    console.log('   • Segments: Cleared')
    console.log('   • Scripts: Cleared')
    console.log(`   • Ultra Chat: ${questionCount} messages removed`)
    console.log('   • Progress: Reset to 0%')
    console.log(`\n🎬 Ready to prepare Episode #${activeEpisode.episode_number}!`)

  } catch (error) {
    console.error('\n❌ Error clearing show data:', error)
    process.exit(1)
  }
}

// Run the script
clearShowData()
