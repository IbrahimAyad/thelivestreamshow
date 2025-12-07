import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGraphics() {
  console.log('🔍 Checking broadcast_graphics table...\n')

  const { data, error } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .order('graphic_type')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📊 All Graphics:')
  data?.forEach(g => {
    console.log(`\n${g.graphic_type}:`)
    console.log(`  - ID: ${g.id}`)
    console.log(`  - Visible: ${g.is_visible}`)
    console.log(`  - HTML File: ${g.html_file || 'null (using React component)'}`)
    console.log(`  - Display Mode: ${g.display_mode || 'overlay'}`)
    console.log(`  - Z-Index: ${g.z_index || 1000}`)
  })

  console.log('\n\n✅ Currently Visible Graphics:')
  const visible = data?.filter(g => g.is_visible)
  if (visible && visible.length > 0) {
    visible.forEach(g => {
      console.log(`  - ${g.graphic_type}`)
    })
  } else {
    console.log('  (none)')
  }
}

checkGraphics()
