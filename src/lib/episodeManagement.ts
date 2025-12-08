/**
 * Episode Management Utilities
 * Handle episode lifecycle: clear, archive, create new
 */

import { supabase } from './supabase'

/**
 * Clear all AI-generated content for an episode (keeps episode_info)
 */
export async function clearEpisodeContent(episodeId: string) {
  console.log('🗑️ Clearing episode content...')

  try {
    // Delete all AI content
    await supabase
      .from('episode_ai_content')
      .delete()
      .eq('episode_info_id', episodeId)

    // Delete all segments
    await supabase
      .from('episode_segments')
      .delete()
      .eq('episode_info_id', episodeId)

    // Delete scripts
    await supabase
      .from('episode_scripts')
      .delete()
      .eq('episode_info_id', episodeId)

    // Reset prep progress
    await supabase
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
      .eq('episode_info_id', episodeId)

    console.log('✅ Episode content cleared successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Error clearing episode:', error)
    return { success: false, error }
  }
}

/**
 * Archive current episode and create next episode
 */
export async function archiveAndCreateNew(currentEpisodeId: string) {
  console.log('📁 Archiving episode and creating new...')

  try {
    // Get current episode info
    const { data: currentEpisode, error: fetchError } = await supabase
      .from('episode_info')
      .select('*')
      .eq('id', currentEpisodeId)
      .single()

    if (fetchError) throw fetchError

    // Archive current episode
    await supabase
      .from('episode_prep_progress')
      .update({ prep_status: 'archived' })
      .eq('episode_info_id', currentEpisodeId)

    // Create new episode with incremented number
    const newEpisodeNumber = (currentEpisode.episode_number || 0) + 1
    const newDate = new Date().toISOString().split('T')[0]

    const { data: newEpisode, error: createError } = await supabase
      .from('episode_info')
      .insert({
        episode_number: newEpisodeNumber,
        episode_date: newDate,
        episode_title: `MORNING SHOW - ${newEpisodeNumber}`,
        episode_topic: 'TBD',
        is_active: true
      })
      .select()
      .single()

    if (createError) throw createError

    // Set as active episode
    await supabase
      .from('episode_info')
      .update({ is_active: false })
      .neq('id', newEpisode.id)

    await supabase
      .from('episode_info')
      .update({ is_active: true })
      .eq('id', newEpisode.id)

    // Create prep progress record
    await supabase
      .from('episode_prep_progress')
      .insert({
        episode_info_id: newEpisode.id,
        prep_status: 'not_started',
        prep_completion_percent: 0
      })

    console.log(`✅ Archived Episode #${currentEpisode.episode_number}, created Episode #${newEpisodeNumber}`)
    return { success: true, newEpisode }

  } catch (error) {
    console.error('❌ Error archiving and creating new:', error)
    return { success: false, error }
  }
}

/**
 * Mark episode as ready for broadcast
 */
export async function markAsReady(episodeId: string) {
  console.log('📺 Marking episode as ready for broadcast...')

  try {
    await supabase
      .from('episode_prep_progress')
      .update({
        prep_status: 'ready_for_broadcast',
        prep_completion_percent: 100
      })
      .eq('episode_info_id', episodeId)

    console.log('✅ Episode marked as ready for broadcast')
    return { success: true }

  } catch (error) {
    console.error('❌ Error marking as ready:', error)
    return { success: false, error }
  }
}

/**
 * Set episode to LIVE status
 */
export async function goLive(episodeId: string) {
  console.log('🔴 Setting episode to LIVE...')

  try {
    await supabase
      .from('episode_prep_progress')
      .update({ prep_status: 'live' })
      .eq('episode_info_id', episodeId)

    console.log('✅ Episode is now LIVE')
    return { success: true }

  } catch (error) {
    console.error('❌ Error going live:', error)
    return { success: false, error }
  }
}

/**
 * Get all archived episodes
 */
export async function getArchivedEpisodes() {
  const { data, error } = await supabase
    .from('episode_info')
    .select(`
      *,
      episode_prep_progress (*)
    `)
    .order('episode_number', { ascending: false })

  if (error) {
    console.error('Error fetching archived episodes:', error)
    return []
  }

  // Filter episodes that are archived or completed
  return data.filter(ep =>
    ep.episode_prep_progress?.[0]?.prep_status === 'archived' ||
    ep.episode_prep_progress?.[0]?.prep_status === 'completed'
  )
}
