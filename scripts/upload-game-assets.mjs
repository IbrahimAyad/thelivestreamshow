import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const supabaseUrl = 'https://vcniezwtltraqramjlux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const BUCKET_NAME = 'game-assets'
const BASE_DIR = 'public/big-time-lucky-13'

async function createBucketIfNeeded() {
  console.log('🗄️  Checking storage bucket...')

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ Error listing buckets:', listError)
    return false
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!bucketExists) {
    console.log(`📦 Creating bucket: ${BUCKET_NAME}`)
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    })

    if (createError) {
      console.error('❌ Error creating bucket:', createError)
      return false
    }
    console.log('✅ Bucket created successfully')
  } else {
    console.log('✅ Bucket already exists')
  }

  return true
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = join(dirPath, file)
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
    } else {
      arrayOfFiles.push(filePath)
    }
  })

  return arrayOfFiles
}

function getContentType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'txt': 'text/plain',
  }
  return types[ext || ''] || 'application/octet-stream'
}

async function uploadFile(localPath, storagePath) {
  try {
    const fileBuffer = readFileSync(localPath)
    const contentType = getContentType(localPath)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.error(`❌ Error uploading ${storagePath}:`, error.message)
      return false
    }

    console.log(`✅ Uploaded: ${storagePath}`)
    return true
  } catch (err) {
    console.error(`❌ Failed to upload ${storagePath}:`, err)
    return false
  }
}

async function uploadAssets() {
  console.log('🎮 Starting Big Time Lucky 13 asset upload...\n')

  // Create bucket if needed
  const bucketReady = await createBucketIfNeeded()
  if (!bucketReady) {
    console.error('❌ Could not prepare storage bucket. Exiting.')
    process.exit(1)
  }

  // Get all files to upload (skip assets directory - keep in git)
  const directories = ['images', 'audio', 'video']
  let totalFiles = 0
  let uploadedFiles = 0

  for (const dir of directories) {
    const fullPath = join(BASE_DIR, dir)
    console.log(`\n📂 Processing ${dir}/...`)

    const files = getAllFiles(fullPath)
    totalFiles += files.length

    for (const file of files) {
      const relativePath = relative(BASE_DIR, file)
      const storagePath = `big-time-lucky-13/${relativePath}`

      const success = await uploadFile(file, storagePath)
      if (success) uploadedFiles++

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`\n📊 Upload complete!`)
  console.log(`✅ Uploaded: ${uploadedFiles}/${totalFiles} files`)

  if (uploadedFiles < totalFiles) {
    console.log(`⚠️  ${totalFiles - uploadedFiles} files failed to upload`)
  }

  // Generate public URLs example
  console.log(`\n🔗 Assets will be available at:`)
  console.log(`${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/big-time-lucky-13/`)
}

uploadAssets().catch(console.error)
