import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

const bookSourcePath = '/Users/ibrahim/Desktop/Livestream-Show/13 Month-Time-Dimin/website_book'

async function uploadBookFiles() {
  console.log('📚 Uploading The Thirteenth Month book files to Supabase...\n')

  // Create bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets()
  const booksBucketExists = buckets?.some(b => b.name === 'books')

  if (!booksBucketExists) {
    console.log('Creating "books" bucket...')
    const { error } = await supabase.storage.createBucket('books', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf', 'application/epub+zip']
    })
    if (error) {
      console.error('Error creating bucket:', error)
      return
    }
    console.log('✓ Bucket created\n')
  }

  // Files to upload
  const files = [
    { name: 'The_Thirteenth_Month.pdf', path: path.join(bookSourcePath, 'The_Thirteenth_Month.pdf') },
    { name: 'The_Thirteenth_Month.epub', path: path.join(bookSourcePath, 'The_Thirteenth_Month.epub') }
  ]

  for (const file of files) {
    try {
      console.log(`Uploading ${file.name}...`)

      // Read file
      const fileBuffer = fs.readFileSync(file.path)
      const fileSize = (fileBuffer.length / 1024).toFixed(2)
      console.log(`  File size: ${fileSize} KB`)

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('books')
        .upload(`thirteenth-month/${file.name}`, fileBuffer, {
          contentType: file.name.endsWith('.pdf') ? 'application/pdf' : 'application/epub+zip',
          upsert: true
        })

      if (error) {
        console.error(`  ❌ Error uploading ${file.name}:`, error)
      } else {
        console.log(`  ✓ ${file.name} uploaded successfully`)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('books')
          .getPublicUrl(`thirteenth-month/${file.name}`)

        console.log(`  📎 Public URL: ${urlData.publicUrl}\n`)
      }
    } catch (err) {
      console.error(`  ❌ Error processing ${file.name}:`, err)
    }
  }

  console.log('✅ Upload complete!')
}

uploadBookFiles()
