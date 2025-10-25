#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
  console.log('🔍 VERIFYING DATABASE STATUS\n')
  console.log('Database: vcniezwtltraqramjlux.supabase.co\n')
  
  // Test 1: Check if table exists
  console.log('1️⃣ Checking broadcast_graphics table...')
  const { data: graphics, error: graphicsError } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .limit(1)
  
  if (graphicsError) {
    console.error('❌ Table does not exist or is inaccessible!')
    console.error('   Error:', graphicsError.message)
    return
  }
  
  console.log('✅ Table exists!\n')
  
  // Test 2: Check columns
  console.log('2️⃣ Checking table structure...')
  if (graphics && graphics[0]) {
    const columns = Object.keys(graphics[0])
    console.log('   Columns found:', columns)
    
    if (columns.includes('z_index')) {
      console.log('   ✅ z_index column EXISTS')
    } else {
      console.log('   ❌ z_index column MISSING')
      console.log('\n⚠️  YOU NEED TO RUN THE SQL MIGRATION!')
      console.log('   Go to: https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql/new')
      console.log('   Copy SQL from: ADD_Z_INDEX_TO_YOUR_PROJECT.sql')
    }
  }
  
  console.log('\n3️⃣ Counting graphics...')
  const { count } = await supabase
    .from('broadcast_graphics')
    .select('*', { count: 'exact', head: true })
  
  console.log(`   Total graphics: ${count}`)
  
  // Test 3: Try the problematic query
  console.log('\n4️⃣ Testing problematic query...')
  const { data: testData, error: testError } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .eq('is_visible', true)
    .order('z_index', { ascending: true })
  
  if (testError) {
    console.error('   ❌ Query FAILS:', testError.message)
    console.error('   This is causing the 400 errors!')
  } else {
    console.log('   ✅ Query works! Found', testData?.length, 'visible graphics')
  }
}

verify()
