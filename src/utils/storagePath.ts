/**
 * Storage Path Normalization Utilities
 * 
 * Ensures consistent path formatting for Supabase Storage
 * CRITICAL: These rules MUST match your upload logic exactly!
 */

/**
 * Normalize a music storage path to match Supabase Storage keys
 * 
 * Rules:
 * 1. Remove leading slashes
 * 2. Collapse spaces to underscores
 * 3. Only allow safe characters: [a-zA-Z0-9._-]
 * 4. Prevent empty paths or "undefined" strings
 * 
 * @param input Raw path string (may come from DB, user input, etc.)
 * @returns Normalized storage key safe for Supabase
 * @throws Error if path is invalid
 */
export function normalizeMusicPath(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error(`Invalid path input: ${input}`)
  }

  // 1. Remove leading/trailing whitespace and slashes
  let path = input.trim().replace(/^\/+/, '')

  // 2. Collapse spaces and replace with underscores
  path = path.replace(/\s+/g, '_')

  // 3. Only allow safe characters: alphanumeric, dots, underscores, hyphens
  // This prevents issues with special characters in URLs
  path = path.replace(/[^a-zA-Z0-9._-]/g, '_')

  // 4. Validate result
  if (!path || path === '' || path.includes('undefined') || path.includes('null')) {
    throw new Error(`Path normalization resulted in invalid key: "${input}" -> "${path}"`)
  }

  return path
}

/**
 * Extract the filename (last segment) from a storage path
 * 
 * @param path Storage path (e.g., "music/song.mp3" or "song.mp3")
 * @returns Filename only (e.g., "song.mp3")
 */
export function getFilename(path: string): string {
  const normalized = normalizeMusicPath(path)
  return normalized.split('/').pop() || normalized
}

/**
 * Extract the parent folder from a storage path
 * 
 * @param path Storage path (e.g., "music/subfolder/song.mp3")
 * @returns Parent folder (e.g., "music/subfolder") or empty string if no parent
 */
export function getParentFolder(path: string): string {
  const normalized = normalizeMusicPath(path)
  const parts = normalized.split('/')
  
  if (parts.length <= 1) {
    return '' // No parent folder
  }
  
  return parts.slice(0, -1).join('/')
}

/**
 * Validate that a path looks like a valid storage key
 * 
 * @param path Path to validate
 * @returns true if path appears valid
 */
export function isValidStoragePath(path: string): boolean {
  try {
    const normalized = normalizeMusicPath(path)
    return (
      normalized.length > 0 &&
      !normalized.includes('undefined') &&
      !normalized.includes('null') &&
      !normalized.startsWith('/') &&
      /^[a-zA-Z0-9._/-]+$/.test(normalized)
    )
  } catch {
    return false
  }
}

/**
 * Build a music storage path with proper formatting
 * 
 * @param filename The filename (will be normalized)
 * @param subfolder Optional subfolder within the music bucket
 * @returns Complete storage path
 */
export function buildMusicPath(filename: string, subfolder?: string): string {
  const normalizedFilename = normalizeMusicPath(filename)
  
  if (!subfolder) {
    return normalizedFilename
  }
  
  const normalizedFolder = normalizeMusicPath(subfolder)
  return `${normalizedFolder}/${normalizedFilename}`
}
