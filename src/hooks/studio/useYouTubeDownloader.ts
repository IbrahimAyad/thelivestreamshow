import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DownloadProgress {
  stage: 'idle' | 'fetching_metadata' | 'downloading_audio' | 'uploading' | 'saving' | 'complete' | 'error'
  message: string
  progress: number // 0-100
}

interface YouTubeMetadata {
  title: string
  artist: string
  duration: number
  thumbnail: string
  copyright_status: any
}

// Railway proxy service
const PROXY_URL = import.meta.env.VITE_PROXY_URL || ''
const YOUTUBE_API_KEY = 'AIzaSyAx49jehLQgehTn7VKMvktzOMcuhqfOyTw'

// Debug logging
console.log('🔍 Environment Check:', {
  PROXY_URL,
  hasProxyURL: !!PROXY_URL,
  envValue: import.meta.env.VITE_PROXY_URL
})

export function useYouTubeDownloader() {
  const [progress, setProgress] = useState<DownloadProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null)

  const extractVideoId = (url: string): string | null => {
    const match1 = url.match(/[?&]v=([^&]+)/)
    if (match1) return match1[1]
    const match2 = url.match(/youtu\.be\/([^?&]+)/)
    if (match2) return match2[1]
    return null
  }

  const fetchYouTubeMetadata = async (videoId: string): Promise<YouTubeMetadata> => {
    // Try Railway proxy first
    if (PROXY_URL) {
      try {
        const proxyUrl = `${PROXY_URL}/api/youtube-metadata?videoId=${videoId}`
        const response = await fetch(proxyUrl)
        
        if (response.ok) {
          const data = await response.json()
          if (data.items && data.items.length > 0) {
            const video = data.items[0]
            const snippet = video.snippet
            const contentDetails = video.contentDetails
            const status = video.status
            const duration = parseDuration(contentDetails.duration)
            const copyrightInfo = analyzeCopyright(snippet, contentDetails, status)

            return {
              title: snippet.title,
              artist: snippet.channelTitle,
              duration,
              thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
              copyright_status: copyrightInfo
            }
          }
        }
      } catch (proxyError) {
        console.warn('Proxy failed, falling back to direct API:', proxyError)
      }
    }

    // Fallback to direct YouTube API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${YOUTUBE_API_KEY}`
    
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found or unavailable')
    }

    const video = data.items[0]
    const snippet = video.snippet
    const contentDetails = video.contentDetails
    const status = video.status

    // Parse duration
    const duration = parseDuration(contentDetails.duration)

    // Analyze copyright
    const copyrightInfo = analyzeCopyright(snippet, contentDetails, status)

    return {
      title: snippet.title,
      artist: snippet.channelTitle,
      duration,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      copyright_status: copyrightInfo
    }
  }

  const parseDuration = (isoDuration: string): number => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    const seconds = parseInt(match[3] || '0', 10)
    return hours * 3600 + minutes * 60 + seconds
  }

  const analyzeCopyright = (snippet: any, contentDetails: any, status: any) => {
    const licensedContent = contentDetails.licensedContent || false
    const embeddable = status.embeddable !== false
    const title = (snippet.title || '').toLowerCase()
    const description = (snippet.description || '').toLowerCase()
    const hasCopyrightNotice = title.includes('copyright') || description.includes('copyright')

    let usage_policy = 'unknown'
    let playable_duration = null
    let warning_message = ''

    if (licensedContent) {
      usage_policy = 'blocked'
      warning_message = 'Licensed content. Use at your own risk.'
    } else if (hasCopyrightNotice) {
      usage_policy = 'partial'
      playable_duration = 30
      warning_message = 'Contains copyright notices. 30s preview only.'
    } else if (embeddable) {
      usage_policy = 'full'
    } else {
      usage_policy = 'blocked'
      warning_message = 'Embedding disabled. Use with caution.'
    }

    return {
      is_copyrighted: licensedContent || hasCopyrightNotice,
      safe_for_streaming: embeddable && !licensedContent,
      usage_policy,
      playable_duration,
      warning_message,
      license_type: licensedContent ? 'copyrighted' : 'unknown',
      last_checked: new Date().toISOString()
    }
  }

  const downloadFromYtDlp = async (youtubeUrl: string): Promise<Blob> => {
    console.log('🎵 Starting yt-dlp download:', { youtubeUrl, PROXY_URL, hasProxy: !!PROXY_URL })
    
    if (!PROXY_URL) {
      throw new Error('Railway proxy URL not configured')
    }

    console.log('✅ Downloading via yt-dlp backend...')
    
    try {
      const proxyUrl = `${PROXY_URL}/api/youtube-download`
      console.log('📡 Calling yt-dlp endpoint:', proxyUrl)
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 second timeout
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: youtubeUrl }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Download failed with status ${response.status}`)
      }

      // Response is the audio file directly
      console.log('🔄 Converting response to blob...')
      const audioBlob = await response.blob()
      
      if (audioBlob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      console.log('✅ Download successful, file size:', audioBlob.size)
      return audioBlob

    } catch (error: any) {
      console.error('❌ yt-dlp download error:', error)
      if (error.name === 'AbortError') {
        throw new Error('Download timed out after 120 seconds. Please try a shorter video or try again later.')
      }
      throw new Error(`Failed to download audio: ${error.message}`)
    }
  }

  const downloadYouTubeAudio = async (
    url: string,
    category: 'music' | 'jingle',
    friendlyName?: string
  ) => {
    try {
      // Stage 1: Extract video ID
      const videoId = extractVideoId(url)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      // Stage 2: Fetch metadata
      setProgress({ stage: 'fetching_metadata', message: 'Fetching video metadata...', progress: 10 })
      const meta = await fetchYouTubeMetadata(videoId)
      setMetadata(meta)
      
      // Stage 3: Download audio
      setProgress({ stage: 'downloading_audio', message: 'Downloading audio from YouTube...', progress: 30 })
      const audioBlob = await downloadFromYtDlp(url)
      
      // Stage 4: Upload to Supabase Storage
      setProgress({ stage: 'uploading', message: 'Uploading to library...', progress: 60 })
      
      const timestamp = Date.now()
      const fileName = `youtube-${videoId}-${timestamp}.mp3`
      
      // Convert blob to File
      const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music-audio')
        .upload(fileName, audioFile, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music-audio')
        .getPublicUrl(fileName)

      // Stage 5: Save to database
      setProgress({ stage: 'saving', message: 'Saving metadata...', progress: 85 })
      
      const { data: dbData, error: dbError } = await supabase
        .from('music_library')
        .insert({
          title: meta.title,
          artist: meta.artist,
          duration: meta.duration,
          file_url: publicUrl,
          file_path: fileName,
          file_size: audioBlob.size,
          category,
          friendly_name: friendlyName || null,
          source_url: url,
          download_date: new Date().toISOString(),
          copyright_info: meta.copyright_status
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      setProgress({ stage: 'complete', message: 'Download complete!', progress: 100 })
      
      return {
        success: true,
        audioId: dbData.id,
        metadata: meta
      }

    } catch (error: any) {
      console.error('Download error:', error)
      setProgress({
        stage: 'error',
        message: error.message || 'Download failed',
        progress: 0
      })
      throw error
    }
  }

  const downloadDirectAudio = async (
    url: string,
    category: 'music' | 'jingle',
    friendlyName?: string
  ) => {
    try {
      setProgress({ stage: 'downloading_audio', message: 'Downloading audio file...', progress: 20 })
      
      // Try direct download
      let audioBlob: Blob
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      audioBlob = await response.blob()

      setProgress({ stage: 'uploading', message: 'Uploading to library...', progress: 60 })
      
      const timestamp = Date.now()
      const extension = url.split('.').pop()?.split('?')[0] || 'mp3'
      const fileName = `direct-${timestamp}.${extension}`
      
      const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' })
      
      const { error: uploadError } = await supabase.storage
        .from('music-audio')
        .upload(fileName, audioFile, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('music-audio')
        .getPublicUrl(fileName)

      setProgress({ stage: 'saving', message: 'Saving metadata...', progress: 85 })
      
      const { data: dbData, error: dbError } = await supabase
        .from('music_library')
        .insert({
          title: fileName,
          artist: 'Unknown',
          duration: 0,
          file_url: publicUrl,
          file_path: fileName,
          file_size: audioBlob.size,
          category,
          friendly_name: friendlyName || null,
          source_url: url,
          download_date: new Date().toISOString(),
          copyright_info: {
            is_copyrighted: false,
            safe_for_streaming: true,
            usage_policy: 'unknown',
            warning_message: 'Direct download. Verify usage rights.'
          }
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      setProgress({ stage: 'complete', message: 'Download complete!', progress: 100 })
      
      return {
        success: true,
        audioId: dbData.id
      }

    } catch (error: any) {
      console.error('Download error:', error)
      setProgress({
        stage: 'error',
        message: error.message || 'Download failed',
        progress: 0
      })
      throw error
    }
  }

  const reset = () => {
    setProgress({ stage: 'idle', message: '', progress: 0 })
    setMetadata(null)
  }

  return {
    progress,
    metadata,
    downloadYouTubeAudio,
    downloadDirectAudio,
    reset
  }
}
