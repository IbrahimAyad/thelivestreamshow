/**
 * Supabase Configuration for Scripts
 *
 * This file loads Supabase credentials from environment variables.
 * Make sure you have a .env.local file in the root directory.
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

// Supabase credentials
export const supabaseUrl = process.env.VITE_SUPABASE_URL
export const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

// Validate that credentials are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Make sure .env.local exists with:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Log confirmation (helpful for debugging)
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]
console.log('✅ Supabase config loaded')
console.log(`   Project: ${projectRef}`)
