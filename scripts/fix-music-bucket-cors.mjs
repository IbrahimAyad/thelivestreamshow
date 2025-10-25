#!/usr/bin/env node

/**
 * Fix CORS Configuration for Music Storage Bucket
 * 
 * This script configures the music-audio bucket to allow Web Audio API access
 * by setting proper CORS headers for cross-origin requests.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const bucketName = process.env.VITE_MUSIC_BUCKET || 'music-audio'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

console.log('🔧 Fixing CORS configuration for music bucket...')
console.log(`   Bucket: ${bucketName}`)
console.log(`   URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBucketCORS() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      return false
    }

    const bucket = buckets.find(b => b.name === bucketName)
    
    if (!bucket) {
      console.error(`❌ Bucket '${bucketName}' not found`)
      console.log('   Available buckets:', buckets.map(b => b.name).join(', '))
      return false
    }

    console.log('✓ Bucket found:', bucket.name)
    console.log('  Public:', bucket.public)
    console.log('  File size limit:', bucket.file_size_limit || 'unlimited')

    // Update bucket to be public if it isn't already
    if (!bucket.public) {
      console.log('\n📝 Making bucket public...')
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        file_size_limit: bucket.file_size_limit,
      })

      if (updateError) {
        console.error('❌ Error making bucket public:', updateError.message)
        return false
      }

      console.log('✓ Bucket is now public')
    } else {
      console.log('✓ Bucket is already public')
    }

    console.log('\n✅ CORS Configuration Complete!')
    console.log('\nℹ️  Additional Steps Required:')
    console.log('   1. Go to Supabase Dashboard → Storage → music-audio')
    console.log('   2. Click "Configuration" tab')
    console.log('   3. Ensure "Public bucket" is enabled')
    console.log('   4. Add CORS policy with these headers:')
    console.log('      - Access-Control-Allow-Origin: *')
    console.log('      - Access-Control-Allow-Methods: GET, HEAD')
    console.log('      - Access-Control-Allow-Headers: *')
    console.log('\n   Or run this SQL in Supabase SQL Editor:')
    console.log(`
      -- Enable CORS for music bucket
      UPDATE storage.buckets 
      SET public = true,
          avif_autodetection = false,
          allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
      WHERE name = '${bucketName}';
    `)

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Run the fix
fixBucketCORS().then(success => {
  process.exit(success ? 0 : 1)
})
