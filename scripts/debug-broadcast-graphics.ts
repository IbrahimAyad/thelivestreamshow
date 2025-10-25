#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugBroadcastGraphics() {
  console.log('🔍 Debugging broadcast_graphics table...\n')

  try {
    // Test basic query
    console.log('1️⃣ Testing basic SELECT query...')
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .select('*')

    if (error) {
      console.error('❌ Query error:', error)
      console.error('   Message:', error.message)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)
      console.error('   Code:', error.code)
      return
    }

    console.log(`✅ Query successful! Found ${data?.length || 0} records\n`)

    // Show overlay types
    if (data && data.length > 0) {
      console.log('📋 Overlay types in database:')
      data.forEach((graphic: any) => {
        console.log(`   • ${graphic.graphic_type} (${graphic.is_visible ? '👁️  visible' : '⚫ hidden'})`)
      })
      console.log('')
    }

    // Test filtered query
    console.log('2️⃣ Testing filtered query (is_visible = true)...')
    const { data: visibleData, error: visibleError } = await supabase
      .from('broadcast_graphics')
      .select('*')
      .eq('is_visible', true)

    if (visibleError) {
      console.error('❌ Filtered query error:', visibleError)
    } else {
      console.log(`✅ Found ${visibleData?.length || 0} visible overlays\n`)
    }

    // Test with specific columns
    console.log('3️⃣ Testing column selection...')
    const { data: columnData, error: columnError } = await supabase
      .from('broadcast_graphics')
      .select('id, graphic_type, is_visible, html_file')

    if (columnError) {
      console.error('❌ Column query error:', columnError)
    } else {
      console.log(`✅ Column selection successful (${columnData?.length || 0} records)\n`)
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

debugBroadcastGraphics()
