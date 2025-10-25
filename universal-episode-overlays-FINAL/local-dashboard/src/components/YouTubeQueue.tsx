import { useState, useEffect } from 'react'
import { Play, Plus, Trash2, ChevronUp, ChevronDown, Youtube } from 'lucide-react'
import { supabase, VideoQueue } from '../lib/supabase'

interface YouTubeQueueProps {
  onPlayVideo?: (videoId: string) => void
}

export const YouTubeQueue = ({ onPlayVideo }: YouTubeQueueProps) => {
  const [queue, setQueue] = useState<VideoQueue[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadQueue()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('video_queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_queue' }, () => {
        loadQueue()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadQueue = async () => {
    const { data } = await supabase
      .from('video_queue')
      .select('*')
      .order('position', { ascending: true })
    
    if (data) setQueue(data)
  }

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const addVideo = async () => {
    if (!videoUrl) return
    
    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      alert('Invalid YouTube URL or video ID')
      return
    }

    setLoading(true)
    
    try {
      // Fetch real metadata from YouTube Data API via edge function
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token
      
      const response = await fetch('https://vcniezwtltraqramjlux.supabase.co/functions/v1/fetch-youtube-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ',
        },
        body: JSON.stringify({ videoId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch video metadata')
      }

      const { data: metadata } = await response.json()
      
      const { error } = await supabase
        .from('video_queue')
        .insert({
          video_id: videoId,
          title: metadata.title,
          thumbnail_url: metadata.thumbnailUrl,
          duration: metadata.duration,
          channel_title: metadata.channelTitle,
          position: queue.length,
          status: 'queued'
        })

      if (error) throw error
      
      setVideoUrl('')
    } catch (err) {
      console.error('Error adding video:', err)
      alert('Failed to add video. Please check the video ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeVideo = async (id: string) => {
    await supabase.from('video_queue').delete().eq('id', id)
  }

  const moveVideo = async (id: string, direction: 'up' | 'down') => {
    const index = queue.findIndex(v => v.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === queue.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newQueue = [...queue]
    const temp = newQueue[index]
    newQueue[index] = newQueue[newIndex]
    newQueue[newIndex] = temp

    // Update positions in database
    for (let i = 0; i < newQueue.length; i++) {
      await supabase
        .from('video_queue')
        .update({ position: i })
        .eq('id', newQueue[i].id)
    }
  }

  const playVideo = async (video: VideoQueue) => {
    await supabase
      .from('video_queue')
      .update({ status: 'playing' })
      .eq('id', video.id)
    
    if (onPlayVideo) {
      onPlayVideo(video.video_id)
    }
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-500" />
        YouTube Queue
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste YouTube URL or video ID"
          className="flex-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && addVideo()}
        />
        <button
          onClick={addVideo}
          disabled={loading || !videoUrl}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {queue.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No videos in queue. Add videos to get started.</p>
        )}

        {queue.map((video, index) => (
          <div
            key={video.id}
            className={`bg-[#1a1a1a] border rounded p-3 flex items-center gap-3 ${
              video.status === 'playing' ? 'border-red-500' : 'border-[#3a3a3a]'
            }`}
          >
            <img
              src={video.thumbnail_url || ''}
              alt={video.title}
              className="w-24 h-16 object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="90"%3E%3Crect fill="%23333" width="120" height="90"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666" font-size="14"%3ENo Preview%3C/text%3E%3C/svg%3E'
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{video.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {video.channel_title && (
                  <p className="text-gray-500 text-xs truncate">{video.channel_title}</p>
                )}
                {video.channel_title && video.duration && (
                  <span className="text-gray-600">•</span>
                )}
                {video.duration && (
                  <p className="text-gray-500 text-xs">{formatDuration(video.duration)}</p>
                )}
              </div>
              {video.status === 'playing' && (
                <span className="text-red-400 text-xs font-semibold">NOW PLAYING</span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => moveVideo(video.id, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveVideo(video.id, 'down')}
                disabled={index === queue.length - 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => playVideo(video)}
                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeVideo(video.id)}
                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
