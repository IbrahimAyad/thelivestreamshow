#!/usr/bin/env node
/**
 * Clear Morning Show AI Prep and Ultra Chat Data
 * Resets the show to a clean slate for new episode preparation
 */

const SUPABASE_URL = 'https://dwrdhnzqjhqmmlwnhlyu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cmRobnpxamhxbW1sd25obHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNzk0NTUsImV4cCI6MjA0NTc1NTQ1NX0.qhR0G59Ga0FtXdJ7VfvLjmSO_I9Wg-w-d8IQq7GYVjE'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

async function clearShowData() {
  console.log('🧹 Starting Morning Show data cleanup...\n')

  try {
    // 1. Get the current active episode
    console.log('📋 Finding active episode...')
    const episodeResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_info?is_active=eq.true&select=*,episode_prep_progress(*)`,
      { headers }
    )

    if (!episodeResponse.ok) {
      throw new Error(`Failed to fetch episode: ${await episodeResponse.text()}`)
    }

    const episodes = await episodeResponse.json()

    if (!episodes || episodes.length === 0) {
      console.log('⚠️  No active episode found')
      return
    }

    const activeEpisode = episodes[0]

    console.log(`✅ Found: Episode #${activeEpisode.episode_number} - ${activeEpisode.episode_title}`)
    console.log(`   Date: ${activeEpisode.episode_date}`)
    console.log(`   Status: ${activeEpisode.episode_prep_progress?.[0]?.prep_status || 'unknown'}`)
    console.log(`   Completion: ${activeEpisode.episode_prep_progress?.[0]?.prep_completion_percent || 0}%\n`)

    // 2. Clear AI-generated content
    console.log('🗑️  Clearing AI-generated content...')
    const aiContentResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_ai_content?episode_info_id=eq.${activeEpisode.id}`,
      { method: 'DELETE', headers }
    )
    if (!aiContentResponse.ok) throw new Error(await aiContentResponse.text())
    console.log('   ✓ AI content cleared')

    // 3. Clear episode segments
    console.log('🗑️  Clearing episode segments...')
    const segmentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_segments?episode_info_id=eq.${activeEpisode.id}`,
      { method: 'DELETE', headers }
    )
    if (!segmentsResponse.ok) throw new Error(await segmentsResponse.text())
    console.log('   ✓ Segments cleared')

    // 4. Clear episode scripts
    console.log('🗑️  Clearing episode scripts...')
    const scriptsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_scripts?episode_info_id=eq.${activeEpisode.id}`,
      { method: 'DELETE', headers }
    )
    if (!scriptsResponse.ok) throw new Error(await scriptsResponse.text())
    console.log('   ✓ Scripts cleared')

    // 5. Get Ultra Chat count first
    console.log('🗑️  Clearing Ultra Chat messages...')
    const questionsCountResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/show_questions?select=id`,
      { headers }
    )
    const questions = await questionsCountResponse.json()
    const questionCount = questions?.length || 0

    if (questionCount > 0) {
      // Clear all Ultra Chat questions
      const clearQuestionsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/show_questions?id=neq.00000000-0000-0000-0000-000000000000`,
        { method: 'DELETE', headers }
      )
      if (!clearQuestionsResponse.ok) throw new Error(await clearQuestionsResponse.text())
      console.log(`   ✓ Cleared ${questionCount} Ultra Chat messages`)
    } else {
      console.log('   ✓ No Ultra Chat messages to clear')
    }

    // 6. Reset prep progress
    console.log('🔄 Resetting prep progress...')
    const progressResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_prep_progress?episode_info_id=eq.${activeEpisode.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
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
      }
    )
    if (!progressResponse.ok) throw new Error(await progressResponse.text())
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
    console.error('\n❌ Error clearing show data:', error.message)
    process.exit(1)
  }
}

// Run the script
clearShowData()
