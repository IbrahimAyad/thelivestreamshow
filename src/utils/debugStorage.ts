/**
 * Storage Debug Utilities
 * 
 * Temporary diagnostic tools to verify Supabase Storage configuration
 * and identify key mismatches.
 */

import { supabase } from '@/lib/supabase'

/**
 * Recursively list all files in the music bucket
 * Shows the actual storage keys that exist
 */
export async function listAllMusicFiles(prefix = ''): Promise<string[]> {
  const files: string[] = []
  
  async function walk(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from('music')
        .list(path || undefined, { limit: 1000 })
      
      if (error) {
        console.warn('[DEBUG STORAGE] Error listing path:', path, error.message)
        return
      }
      
      if (!data || data.length === 0) {
        return
      }
      
      for (const obj of data) {
        const fullPath = path ? `${path}/${obj.name}` : obj.name
        
        // Check if it's a file (has id) or folder (no id)
        if (obj.id) {
          files.push(fullPath)
        } else {
          // It's a folder, recurse into it
          await walk(fullPath)
        }
      }
    } catch (err) {
      console.error('[DEBUG STORAGE] Exception in walk:', err)
    }
  }
  
  await walk(prefix)
  return files
}

/**
 * Test if a specific key exists in storage
 */
export async function testKeyExists(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('music')
      .download(key)
    
    if (error) {
      console.warn('[DEBUG STORAGE] Key does not exist:', key, error.message)
      return false
    }
    
    console.info('[DEBUG STORAGE] ✓ Key exists:', key, 'Size:', data?.size)
    return true
  } catch (err) {
    console.error('[DEBUG STORAGE] Exception testing key:', key, err)
    return false
  }
}

/**
 * Test creating a signed URL for a key
 */
export async function testSignedUrl(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('music')
      .createSignedUrl(key, 3600)
    
    if (error) {
      console.error('[DEBUG STORAGE] Failed to create signed URL:', key, error.message)
      return null
    }
    
    console.info('[DEBUG STORAGE] ✓ Signed URL created:', key, data.signedUrl)
    return data.signedUrl || null
  } catch (err) {
    console.error('[DEBUG STORAGE] Exception creating signed URL:', key, err)
    return null
  }
}

/**
 * Compare database paths with actual storage keys
 */
export async function auditDatabasePaths(): Promise<void> {
  console.info('[DEBUG STORAGE] ========== AUDIT START ==========')
  
  // Get all files in storage
  console.info('[DEBUG STORAGE] Listing all files in music bucket...')
  const storageKeys = await listAllMusicFiles()
  console.info(`[DEBUG STORAGE] Found ${storageKeys.length} files in storage`)
  console.info('[DEBUG STORAGE] Sample storage keys (first 30):')
  storageKeys.slice(0, 30).forEach(key => console.info(`  - ${key}`))
  
  // Get all tracks from database
  console.info('[DEBUG STORAGE] Fetching tracks from database...')
  const { data: tracks, error } = await supabase
    .from('music_library')
    .select('id, title, file_path')
    .limit(100)
  
  if (error) {
    console.error('[DEBUG STORAGE] Failed to fetch tracks:', error.message)
    return
  }
  
  console.info(`[DEBUG STORAGE] Found ${tracks?.length || 0} tracks in database`)
  
  // Compare paths
  const mismatches: string[] = []
  const matches: string[] = []
  
  for (const track of tracks || []) {
    const dbPath = track.file_path
    const exists = storageKeys.includes(dbPath)
    
    if (exists) {
      matches.push(dbPath)
    } else {
      mismatches.push(dbPath)
      console.warn(`[DEBUG STORAGE] ❌ DB path not in storage: "${dbPath}" (${track.title})`)
      
      // Try to find similar keys
      const similar = storageKeys.filter(key => 
        key.toLowerCase().includes(track.title?.toLowerCase().substring(0, 10) || '')
      )
      if (similar.length > 0) {
        console.info(`[DEBUG STORAGE]    Possibly similar keys:`, similar.slice(0, 3))
      }
    }
  }
  
  console.info('[DEBUG STORAGE] ========== AUDIT RESULTS ==========')
  console.info(`[DEBUG STORAGE] ✓ Matches: ${matches.length}`)
  console.info(`[DEBUG STORAGE] ❌ Mismatches: ${mismatches.length}`)
  
  if (mismatches.length > 0) {
    console.info('[DEBUG STORAGE] First 10 mismatched paths:')
    mismatches.slice(0, 10).forEach(path => console.info(`  - ${path}`))
  }
  
  console.info('[DEBUG STORAGE] ========== AUDIT COMPLETE ==========')
}

/**
 * Expose debug functions globally for browser console testing
 */
if (typeof window !== 'undefined') {
  ;(window as any).__MUSIC_STORAGE_DEBUG__ = {
    listAll: listAllMusicFiles,
    testKey: testKeyExists,
    testUrl: testSignedUrl,
    audit: auditDatabasePaths
  }
  console.info('[DEBUG STORAGE] 💡 Debug tools available at: window.__MUSIC_STORAGE_DEBUG__')
  console.info('[DEBUG STORAGE] Usage:')
  console.info('  await window.__MUSIC_STORAGE_DEBUG__.listAll()')
  console.info('  await window.__MUSIC_STORAGE_DEBUG__.testKey("1760924424753_song.mp3")')
  console.info('  await window.__MUSIC_STORAGE_DEBUG__.audit()')
}
