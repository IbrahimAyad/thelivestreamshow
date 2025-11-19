import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vcniezwtltraqramjlux.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createActiveEpisode() {
  console.log('🔍 Checking for existing active episode...')

  // First, deactivate any existing episodes
  const { error: deactivateError } = await supabase
    .from('episode_info')
    .update({ is_active: false })
    .eq('is_active', true)

  if (deactivateError) {
    console.log('Note: No existing active episodes found (this is OK)')
  }

  // Create a new active episode
  console.log('✨ Creating new active episode...')

  const { data, error } = await supabase
    .from('episode_info')
    .insert({
      episode_number: 1,
      episode_title: 'Alpha Wednesday Returns',
      episode_topic: 'AI, Tech News & Community Discussion',
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating episode:', error)
    process.exit(1)
  }

  console.log('✅ Active episode created successfully!')
  console.log('📺 Episode Info:')
  console.log(`   Number: ${data.episode_number}`)
  console.log(`   Title: ${data.episode_title}`)
  console.log(`   Topic: ${data.episode_topic}`)
  console.log(`   Active: ${data.is_active}`)
}

createActiveEpisode()
