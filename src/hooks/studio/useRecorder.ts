import { useState, useEffect, useRef } from 'react'
import { DJSetRecorder, RecordingMetadata } from '@/utils/studio/recording'

export function useRecorder(audioContext: AudioContext | null, masterOutput: AudioNode | null) {
  const recorderRef = useRef<DJSetRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordingTitle, setRecordingTitle] = useState('')
  const durationIntervalRef = useRef<number | null>(null)

  // Initialize recorder
  useEffect(() => {
    if (!audioContext) return

    if (!recorderRef.current) {
      recorderRef.current = new DJSetRecorder(audioContext)
      
      // Connect master output if available
      if (masterOutput) {
        try {
          recorderRef.current.connectSource(masterOutput)
        } catch (error) {
          console.error('Failed to connect recorder to master output:', error)
        }
      }
    }

    return () => {
      if (recorderRef.current) {
        recorderRef.current.disconnect()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [audioContext, masterOutput])

  // Update duration while recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      durationIntervalRef.current = window.setInterval(() => {
        if (recorderRef.current) {
          setDuration(recorderRef.current.getRecordingDuration())
        }
      }, 100)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  const startRecording = async (title: string = 'Untitled') => {
    if (!recorderRef.current) return

    try {
      await recorderRef.current.startRecording()
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      setRecordingTitle(title)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to start recording. Please check your browser permissions.')
    }
  }

  const pauseRecording = () => {
    if (!recorderRef.current) return
    recorderRef.current.pauseRecording()
    setIsPaused(true)
  }

  const resumeRecording = () => {
    if (!recorderRef.current) return
    recorderRef.current.resumeRecording()
    setIsPaused(false)
  }

  const stopRecording = async () => {
    if (!recorderRef.current) return

    try {
      const metadata: RecordingMetadata = {
        title: recordingTitle || 'Untitled',
        date: new Date(),
        duration: duration,
        format: 'webm',
      }

      await recorderRef.current.downloadRecording(metadata)
      setIsRecording(false)
      setIsPaused(false)
      setDuration(0)
      setRecordingTitle('')
    } catch (error) {
      console.error('Failed to stop recording:', error)
      alert('Failed to save recording.')
    }
  }

  const cancelRecording = async () => {
    if (!recorderRef.current) return

    try {
      await recorderRef.current.stopRecording()
      setIsRecording(false)
      setIsPaused(false)
      setDuration(0)
      setRecordingTitle('')
    } catch (error) {
      console.error('Failed to cancel recording:', error)
    }
  }

  return {
    isRecording,
    isPaused,
    duration,
    recordingTitle,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  }
}
