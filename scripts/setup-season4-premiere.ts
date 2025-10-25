import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials for setup script

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupSeason4Premiere() {
  console.log('🎬 Setting up Season 4 Premiere - "Purposeful Illusion"...\n')

  // 1. Update show metadata
  console.log('📋 Updating show metadata...')
  const { error: metadataError } = await supabase
    .from('show_metadata')
    .update({
      episode_number: 401,
      episode_title: 'Purposeful Illusion - Season 4 Premiere',
      episode_topic: 'How the illusion of work, progress, and freedom maintains the modern world',
      updated_at: new Date().toISOString()
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')

  if (metadataError) {
    console.error('❌ Error updating metadata:', metadataError)
  } else {
    console.log('✅ Metadata updated')
  }

  // 2. Clear existing segments
  console.log('\n🗑️  Clearing old segments...')
  const { error: deleteError } = await supabase
    .from('show_segments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.error('⚠️  Error clearing segments:', deleteError)
  } else {
    console.log('✅ Old segments cleared')
  }

  // 3. Insert new segments
  console.log('\n📝 Creating Season 4 segments...')
  
  const segments = [
    {
      segment_name: 'Season 4 Kickoff + Video Premiere',
      segment_topic: 'Welcome Back & Purposeful Illusion Cinematic',
      segment_question: 'What if everything you work for is just... maintenance?',
      segment_order: 1,
      timer_seconds: 1500, // 25 minutes (8:00-8:25)
      is_active: false,
      timer_running: false
    },
    {
      segment_name: 'The Work For Free Era',
      segment_topic: 'Government Shutdown & Modern Slavery',
      segment_question: 'When did working without pay become patriotic duty?',
      segment_order: 2,
      timer_seconds: 2700, // 45 minutes (8:25-9:10)
      is_active: false,
      timer_running: false
    },
    {
      segment_name: 'AI Keepers',
      segment_topic: 'The Humans Who Babysit The Machines',
      segment_question: 'Are you building AI, or is AI building your job around you?',
      segment_order: 3,
      timer_seconds: 3000, // 50 minutes (9:10-10:00)
      is_active: false,
      timer_running: false
    },
    {
      segment_name: 'Digital Empires & Cloud Wars',
      segment_topic: 'Who Really Controls Infrastructure?',
      segment_question: 'If the cloud shuts off, does your country still exist?',
      segment_order: 4,
      timer_seconds: 3000, // 50 minutes (10:00-10:50)
      is_active: false,
      timer_running: false
    },
    {
      segment_name: 'Breaking The Illusion',
      segment_topic: 'Final Thoughts & The Exit Question',
      segment_question: 'If no one was watching... would you still be here?',
      segment_order: 5,
      timer_seconds: 600, // 10 minutes (10:50-11:00)
      is_active: false,
      timer_running: false
    }
  ]

  for (const segment of segments) {
    const { error } = await supabase
      .from('show_segments')
      .insert(segment)

    if (error) {
      console.error(`❌ Error creating segment "${segment.segment_name}":`, error)
    } else {
      console.log(`✅ Created: ${segment.segment_name} (${Math.floor(segment.timer_seconds / 60)} min)`)
    }
  }

  // 4. Add production notes for tonight
  console.log('\n📌 Adding production notes...')
  
  // Get first segment ID for notes
  const { data: firstSegment } = await supabase
    .from('show_segments')
    .select('id')
    .order('segment_order', { ascending: true })
    .limit(1)
    .single()

  if (firstSegment) {
    const productionNotes = [
      {
        segment_id: firstSegment.id,
        note_text: '🎬 InVideo v4.0 Ultra Mode cinematic intro ready (45s high-res)',
        note_type: 'technical',
        is_completed: false
      },
      {
        segment_id: firstSegment.id,
        note_text: '🎵 Sound design: ambient hum → glitch → crescendo hit with heartbeat underlay',
        note_type: 'audio',
        is_completed: false
      },
      {
        segment_id: firstSegment.id,
        note_text: '🎨 Color flow: Blue → Neutral → Amber for emotional progression',
        note_type: 'visual',
        is_completed: false
      },
      {
        segment_id: firstSegment.id,
        note_text: '🗣️ Open panel format: members can join/exit freely, silent exit allowed',
        note_type: 'production',
        is_completed: false
      },
      {
        segment_id: firstSegment.id,
        note_text: '💬 Audience engagement via chat cues (⚙️, 🪞, 🌀 emojis) and polls',
        note_type: 'engagement',
        is_completed: false
      },
      {
        segment_id: firstSegment.id,
        note_text: '🎯 Core message: "Purpose is no longer created — it\'s maintained"',
        note_type: 'thematic',
        is_completed: false
      }
    ]

    for (const note of productionNotes) {
      const { error } = await supabase
        .from('operator_notes')
        .insert(note)

      if (error) {
        console.error(`❌ Error creating note:`, error)
      } else {
        console.log(`✅ ${note.note_text}`)
      }
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log('🎉 Season 4 Premiere Setup Complete!')
  console.log('━'.repeat(60))
  console.log('\n📊 Show Structure Summary:')
  console.log('⏰ Total Runtime: 8:00 PM - 11:00 PM (3 hours)')
  console.log('📺 Stream: Alpha Wednesday Season 4 Premiere')
  console.log('🎬 Episode: 401 - "Purposeful Illusion"')
  console.log('\n🎯 Key Themes:')
  console.log('  • Government shutdown as modern feudalism')
  console.log('  • AI-mediated labour and human "keepers"')
  console.log('  • Technocratic power & digital empire')
  console.log('  • The meaning crisis: purpose vs busyness')
  console.log('\n💡 Tonight\'s Message:')
  console.log('  "Purpose is no longer created — it\'s maintained."')
  console.log('\n✨ Production ready for 8 PM EST start!')
  console.log('━'.repeat(60) + '\n')
}

setupSeason4Premiere()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
