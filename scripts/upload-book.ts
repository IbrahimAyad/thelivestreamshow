#!/usr/bin/env ts-node
/**
 * Upload The Thirteenth Month book files to Supabase Storage
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const BOOK_FILES = [
  { local: '/Users/ibrahim/Downloads/book_formats/The_Thirteenth_Month.pdf', remote: 'books/The_Thirteenth_Month.pdf', type: 'application/pdf' },
  { local: '/Users/ibrahim/Downloads/book_formats/The_Thirteenth_Month.epub', remote: 'books/The_Thirteenth_Month.epub', type: 'application/epub+zip' },
  { local: '/Users/ibrahim/Downloads/book_formats/The_Thirteenth_Month.docx', remote: 'books/The_Thirteenth_Month.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
]

async function uploadBook() {
  console.log('📚 Uploading The Thirteenth Month to Supabase...\n')

  for (const file of BOOK_FILES) {
    console.log(`Uploading ${path.basename(file.local)}...`)

    const fileBuffer = fs.readFileSync(file.local)

    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(file.remote, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error(`❌ Error uploading ${file.remote}:`, error)
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(file.remote)

      console.log(`✅ Uploaded: ${publicUrlData.publicUrl}\n`)
    }
  }

  console.log('🎉 Book upload complete!')
}

uploadBook().catch(console.error)
