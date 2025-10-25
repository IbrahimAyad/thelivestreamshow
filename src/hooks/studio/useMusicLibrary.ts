import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { analyzeAudioFile } from '@/utils/studio/trackAnalyzer'
import type { MusicTrack } from "@/types/database"

export function useMusicLibrary() {
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fetch all tracks
  const fetchTracks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('music_library')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tracks:', error)
    } else {
      setTracks(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTracks()
  }, [])

  // Upload audio file
  const uploadTrack = useCallback(
    async (file: File, metadata: Partial<MusicTrack & { friendly_name?: string }>) => {
      setUploading(true)
      setUploadProgress(0)

      try {
        // Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const filePath = `${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('music')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Use the actual path returned by Supabase
        const actualPath = uploadData?.path || filePath
        console.log('[useMusicLibrary] File uploaded to storage:', actualPath)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('music')
          .getPublicUrl(actualPath)

        // Get audio duration
        const duration = await getAudioDuration(file)

        // Insert into database
        // Store the ACTUAL storage key returned by Supabase (not reconstructed)
        const { data: insertedTrack, error: dbError } = await supabase.from('music_library').insert({
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.artist || null,
          album: metadata.album || null,
          duration: duration,
          file_size: file.size,
          file_url: urlData.publicUrl,
          file_path: actualPath, // Use actual path from Supabase, not derived path
          file_format: fileExt || null,
          category: metadata.category || 'music',
          jingle_type: metadata.jingle_type || null,
          friendly_name: metadata.friendly_name || null,
          analysis_status: 'pending',
        }).select().single()

        if (dbError) throw dbError

        await fetchTracks()
        setUploadProgress(100)

        // Trigger automatic analysis in background (non-blocking)
        if (insertedTrack) {
          analyzeTrackInBackground(insertedTrack.id, urlData.publicUrl)
        }
      } catch (error) {
        console.error('Error uploading track:', error)
        throw error
      } finally {
        setUploading(false)
        setTimeout(() => setUploadProgress(0), 1000)
      }
    },
    [fetchTracks]
  )

  // Delete track
  const deleteTrack = useCallback(
    async (track: MusicTrack) => {
      try {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('music')
          .remove([track.file_path])

        if (storageError) throw storageError

        // Delete from database
        const { error: dbError } = await supabase
          .from('music_library')
          .delete()
          .eq('id', track.id)

        if (dbError) throw dbError

        await fetchTracks()
      } catch (error) {
        console.error('Error deleting track:', error)
        throw error
      }
    },
    [fetchTracks]
  )

  // Background analysis (non-blocking)
  const analyzeTrackInBackground = async (trackId: string, fileUrl: string) => {
    try {
      // Update status to analyzing
      await supabase
        .from('music_library')
        .update({ analysis_status: 'analyzing' })
        .eq('id', trackId)

      // Perform analysis
      const result = await analyzeAudioFile(fileUrl)

      // Update database with results
      if (result.analysisStatus === 'complete') {
        await supabase
          .from('music_library')
          .update({
            bpm: result.bpm,
            musical_key: result.musicalKey,
            analysis_status: 'complete',
            analysis_date: new Date().toISOString()
          })
          .eq('id', trackId)
      } else {
        await supabase
          .from('music_library')
          .update({ analysis_status: 'failed' })
          .eq('id', trackId)
      }

      // Refresh tracks to show updated analysis
      await fetchTracks()
    } catch (error) {
      console.error('Background analysis failed:', error)
      await supabase
        .from('music_library')
        .update({ analysis_status: 'failed' })
        .eq('id', trackId)
    }
  }

  return {
    tracks,
    loading,
    uploading,
    uploadProgress,
    uploadTrack,
    deleteTrack,
    refreshTracks: fetchTracks,
  }
}

// Helper function to get audio duration
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => {
      resolve(Math.floor(audio.duration))
    })
    audio.src = URL.createObjectURL(file)
  })
}
