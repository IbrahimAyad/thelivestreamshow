/**
 * Migration Script: music-audio → music bucket
 * 
 * This script migrates all files from the old `music-audio` bucket
 * to the new `music` bucket and updates database references.
 * 
 * Run with: npx tsx scripts/migrate-music-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required')
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MusicTrack {
  id: string
  file_path: string
  title: string
  file_url: string | null
}

async function migrateFiles() {
  console.log('🔍 Checking for files in music-audio bucket...\n')

  try {
    // Step 1: List all files in old bucket
    const { data: oldFiles, error: listError } = await supabase.storage
      .from('music-audio')
      .list('', { limit: 1000 })

    if (listError) {
      console.error('❌ Failed to list files in music-audio bucket:', listError.message)
      return
    }

    if (!oldFiles || oldFiles.length === 0) {
      console.log('✅ No files found in music-audio bucket. Migration not needed.')
      return
    }

    console.log(`📦 Found ${oldFiles.length} files to migrate:\n`)

    // Step 2: Download and re-upload each file
    for (const file of oldFiles) {
      console.log(`   Migrating: ${file.name}`)

      try {
        // Download from old bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('music-audio')
          .download(file.name)

        if (downloadError) {
          console.error(`   ❌ Download failed: ${downloadError.message}`)
          continue
        }

        // Upload to new bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('music')
          .upload(file.name, fileData, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
            contentType: file.metadata?.mimetype || 'audio/mpeg'
          })

        if (uploadError) {
          console.error(`   ❌ Upload failed: ${uploadError.message}`)
          continue
        }

        console.log(`   ✅ Uploaded to music bucket: ${uploadData.path}`)

        // Step 3: Update database reference
        const { data: tracks, error: selectError } = await supabase
          .from('music_library')
          .select('id, title')
          .eq('file_path', file.name)

        if (selectError) {
          console.error(`   ⚠️  DB lookup failed: ${selectError.message}`)
          continue
        }

        if (tracks && tracks.length > 0) {
          // Get new public URL
          const { data: urlData } = supabase.storage
            .from('music')
            .getPublicUrl(file.name)

          // Update all matching records
          const { error: updateError } = await supabase
            .from('music_library')
            .update({
              file_path: uploadData.path, // Use actual path from upload
              file_url: urlData.publicUrl
            })
            .eq('file_path', file.name)

          if (updateError) {
            console.error(`   ⚠️  DB update failed: ${updateError.message}`)
          } else {
            console.log(`   ✅ Updated ${tracks.length} database record(s)`)
          }
        }

      } catch (err) {
        console.error(`   ❌ Error migrating ${file.name}:`, err)
        continue
      }
    }

    console.log('\n📊 Migration Summary:\n')
    console.log(`   Files processed: ${oldFiles.length}`)
    console.log('   Next steps:')
    console.log('   1. Verify files in Supabase Studio → Storage → music bucket')
    console.log('   2. Test playback in your app')
    console.log('   3. Once verified, delete old files from music-audio bucket')
    console.log('   4. (Optional) Delete music-audio bucket entirely\n')

  } catch (err) {
    console.error('❌ Migration failed:', err)
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n')

  try {
    // Check new bucket
    const { data: newFiles, error: newError } = await supabase.storage
      .from('music')
      .list('', { limit: 1000 })

    if (newError) {
      console.error('❌ Failed to list files in music bucket:', newError.message)
      return
    }

    console.log(`✅ Music bucket contains ${newFiles?.length || 0} files`)

    // Check database
    const { count, error: countError } = await supabase
      .from('music_library')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Failed to count database records:', countError.message)
      return
    }

    console.log(`✅ Database contains ${count || 0} music tracks`)

    // Sample 5 tracks to verify paths
    const { data: sampleTracks, error: sampleError } = await supabase
      .from('music_library')
      .select('id, title, file_path')
      .limit(5)

    if (sampleError) {
      console.error('❌ Failed to sample tracks:', sampleError.message)
      return
    }

    if (sampleTracks && sampleTracks.length > 0) {
      console.log('\n📋 Sample track paths:')
      sampleTracks.forEach((track) => {
        console.log(`   ${track.title}: ${track.file_path}`)
      })
    }

  } catch (err) {
    console.error('❌ Verification failed:', err)
  }
}

async function cleanupOldBucket() {
  console.log('\n⚠️  CLEANUP: Delete old music-audio files?\n')
  console.log('   This will PERMANENTLY DELETE files from music-audio bucket.')
  console.log('   Only do this AFTER verifying migration succeeded!\n')

  // In a real script, you'd add readline prompt here
  // For safety, this is disabled by default
  console.log('   To enable cleanup, uncomment the code in this script.\n')

  // Uncomment to enable cleanup:
  /*
  const { data: oldFiles } = await supabase.storage
    .from('music-audio')
    .list('', { limit: 1000 })

  if (oldFiles && oldFiles.length > 0) {
    const filePaths = oldFiles.map(f => f.name)
    
    const { error } = await supabase.storage
      .from('music-audio')
      .remove(filePaths)

    if (error) {
      console.error('❌ Cleanup failed:', error.message)
    } else {
      console.log(`✅ Deleted ${filePaths.length} files from music-audio bucket`)
    }
  }
  */
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   Music Bucket Migration: music-audio → music          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  await migrateFiles()
  await verifyMigration()
  
  console.log('\n✅ Migration complete!\n')
  console.log('   To cleanup old bucket, uncomment cleanup code and re-run.\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
