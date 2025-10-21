/**
 * DJ Set Recorder - Phase 5E
 * Records DJ sets using MediaRecorder API
 * Exports as WebM/Opus format
 */

export interface RecordingMetadata {
  title: string
  date: Date
  duration: number
  format: string
}

export class DJSetRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private audioContext: AudioContext
  private destination: MediaStreamAudioDestinationNode
  private startTime: number = 0
  private pausedTime: number = 0
  private isPaused: boolean = false

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.destination = audioContext.createMediaStreamDestination()
  }

  connectSource(source: AudioNode): void {
    try {
      if (!source) {
        console.warn('Cannot connect recording: source is null')
        return
      }
      source.connect(this.destination)
      console.log('Recording source connected successfully')
    } catch (error) {
      console.error('Failed to connect recording source:', error)
      throw new Error('Unable to connect audio source for recording. Please ensure audio is playing.')
    }
  }

  async startRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.warn('Already recording')
      return
    }

    this.recordedChunks = []
    this.startTime = Date.now()
    this.pausedTime = 0
    this.isPaused = false

    // Try WebM/Opus first (best quality and widely supported)
    let mimeType = 'audio/webm;codecs=opus'
    
    // Fallback for Safari (uses MP4)
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/mp4'
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.destination.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(1000) // Request data every second
      console.log(`Recording started with format: ${mimeType}`)
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  pauseRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return
    }

    this.mediaRecorder.pause()
    this.pausedTime = Date.now()
    this.isPaused = true
  }

  resumeRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      return
    }

    this.mediaRecorder.resume()
    if (this.pausedTime > 0) {
      this.startTime += Date.now() - this.pausedTime
    }
    this.isPaused = false
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(this.recordedChunks, { type: mimeType })
        this.recordedChunks = []
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  getRecordingDuration(): number {
    if (!this.startTime) return 0
    
    if (this.isPaused && this.pausedTime) {
      return (this.pausedTime - this.startTime) / 1000
    }
    
    return (Date.now() - this.startTime) / 1000
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  getState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive'
    return this.mediaRecorder.state
  }

  async downloadRecording(metadata: RecordingMetadata): Promise<void> {
    try {
      const blob = await this.stopRecording()
      const url = URL.createObjectURL(blob)
      
      // Generate filename
      const dateStr = metadata.date.toISOString().slice(0, 10)
      const timeStr = metadata.date.toTimeString().slice(0, 5).replace(':', '')
      const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const filename = `DJ_Set_${metadata.title}_${dateStr}_${timeStr}.${extension}`
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Failed to download recording:', error)
      throw error
    }
  }

  disconnect(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    this.destination.disconnect()
  }
}

/**
 * Vinyl Emulation Engine
 * Simulates vinyl scratching and platter controls
 */
export interface VinylControlState {
  playbackRate: number // -2 to +2 (reverse to double speed)
  scratchAmount: number // 0 to 1
  inertia: number // 0 to 1 (how much momentum)
  isScratching: boolean
}

export class VinylEmulator {
  private audioElement: HTMLAudioElement
  private state: VinylControlState
  private inertiaInterval: number | null = null
  private lastTouchX: number = 0
  private lastTouchY: number = 0
  private velocity: number = 0

  constructor(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement
    this.state = {
      playbackRate: 1.0,
      scratchAmount: 0,
      inertia: 0.95, // High inertia for realistic vinyl feel
      isScratching: false,
    }
  }

  startScratch(x: number, y: number): void {
    this.state.isScratching = true
    this.lastTouchX = x
    this.lastTouchY = y
    this.velocity = 0
    
    // Stop inertia when user starts scratching
    if (this.inertiaInterval) {
      clearInterval(this.inertiaInterval)
      this.inertiaInterval = null
    }
  }

  updateScratch(x: number, y: number): void {
    if (!this.state.isScratching) return

    // Calculate movement
    const deltaX = x - this.lastTouchX
    const deltaY = y - this.lastTouchY
    
    // X axis controls playback rate (forward/backward)
    // Y axis controls scratch intensity
    const rateChange = deltaX * 0.01
    const scratchIntensity = Math.abs(deltaY) * 0.1
    
    this.state.playbackRate = Math.max(-2, Math.min(2, this.state.playbackRate + rateChange))
    this.state.scratchAmount = Math.min(1, scratchIntensity)
    
    // Calculate velocity for inertia
    this.velocity = rateChange
    
    // Apply to audio
    this.audioElement.playbackRate = this.state.playbackRate
    
    this.lastTouchX = x
    this.lastTouchY = y
  }

  stopScratch(): void {
    this.state.isScratching = false
    this.state.scratchAmount = 0
    
    // Start inertia simulation
    this.simulateInertia()
  }

  private simulateInertia(): void {
    if (this.inertiaInterval) {
      clearInterval(this.inertiaInterval)
    }

    this.inertiaInterval = window.setInterval(() => {
      // Apply friction
      this.velocity *= this.state.inertia
      
      // Update playback rate
      this.state.playbackRate += this.velocity
      
      // Gradually return to normal speed
      if (Math.abs(this.velocity) < 0.001) {
        // Smooth transition back to 1.0
        const diff = 1.0 - this.state.playbackRate
        this.state.playbackRate += diff * 0.1
        
        if (Math.abs(diff) < 0.01) {
          this.state.playbackRate = 1.0
          if (this.inertiaInterval) {
            clearInterval(this.inertiaInterval)
            this.inertiaInterval = null
          }
        }
      }
      
      // Clamp playback rate
      this.state.playbackRate = Math.max(-2, Math.min(2, this.state.playbackRate))
      this.audioElement.playbackRate = this.state.playbackRate
    }, 16) // ~60 FPS
  }

  setInertia(value: number): void {
    this.state.inertia = Math.max(0, Math.min(1, value))
  }

  reset(): void {
    this.state.playbackRate = 1.0
    this.state.scratchAmount = 0
    this.state.isScratching = false
    this.velocity = 0
    this.audioElement.playbackRate = 1.0
    
    if (this.inertiaInterval) {
      clearInterval(this.inertiaInterval)
      this.inertiaInterval = null
    }
  }

  getState(): VinylControlState {
    return { ...this.state }
  }

  disconnect(): void {
    if (this.inertiaInterval) {
      clearInterval(this.inertiaInterval)
      this.inertiaInterval = null
    }
  }
}
