import { useState, useEffect } from 'react'
import { Mic, Radio, CheckCircle, XCircle, AlertCircle, Activity, Server } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useDiscordAudio } from '../hooks/useDiscordAudio'
import { useTTS } from '../hooks/useTTS'
import { useScarlettAudio } from '../hooks/useScarlettAudio'

export function AudioControlCenter() {
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('')
  const [discordPanelListening, setDiscordPanelListening] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)

  // Initialize audio hooks
  const tts = useTTS()
  const discordAudio = useDiscordAudio()
  const scarlettAudio = useScarlettAudio()

  // Initialize speech recognition with selected microphone
  const speechRecognition = useSpeechRecognition({
    microphoneDeviceId: selectedMicrophoneId
  })

  // Check backend server connection
  useEffect(() => {
    const backendEnabled = import.meta.env.VITE_ENABLE_BACKEND !== 'false';

    if (!backendEnabled) {
      console.info('AudioControlCenter: Backend disabled via VITE_ENABLE_BACKEND=false');
      setBackendConnected(false);
      return;
    }

    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 3;

    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        setBackendConnected(response.ok)
        failedAttempts = 0; // Reset on success
      } catch {
        setBackendConnected(false)
        failedAttempts++

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.warn('AudioControlCenter: Backend health checks stopped after 3 failures')
          if (intervalId) clearInterval(intervalId)
        }
      }
    }

    checkBackend()
    const intervalId = setInterval(checkBackend, 30000) // Check every 30s instead of 5s
    return () => clearInterval(intervalId)
  }, [])

  // Enumerate audio devices on mount
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        // Request permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())

        // Now enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(d => d.kind === 'audioinput')
        setAvailableMicrophones(audioInputs)

        // Find BlackHole 2ch and set as default
        const blackHole = audioInputs.find(d => d.label.includes('BlackHole'))
        if (blackHole) {
          setSelectedMicrophoneId(blackHole.deviceId)
          console.log('✅ BlackHole 2ch found and selected by default')
        } else if (audioInputs.length > 0) {
          setSelectedMicrophoneId(audioInputs[0].deviceId)
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error)
      }
    }

    enumerateDevices()
  }, [])

  // Handle BetaBot session start/stop
  const handleToggleBetaBotSession = async () => {
    if (speechRecognition.isListening) {
      speechRecognition.stopListening()
    } else {
      if (!selectedMicrophoneId) {
        alert('Please select a microphone first')
        return
      }
      await speechRecognition.startListening()
    }
  }

  // Handle Discord listening toggle
  const handleToggleDiscordListening = async () => {
    if (discordPanelListening) {
      discordAudio.stopReceiving()
      setDiscordPanelListening(false)
    } else {
      try {
        setDiscordPanelListening(true)
        console.log('✅ Discord panel listening enabled')
      } catch (error) {
        console.error('Failed to start Discord listening:', error)
        setDiscordPanelListening(false)
      }
    }
  }

  // Test audio flow
  const handleTestAudio = async () => {
    await tts.speak('Audio test. This is Beta Bot testing the audio routing system.')
  }

  // Check if all systems are ready
  const isBlackHoleSelected = availableMicrophones.find(m => m.deviceId === selectedMicrophoneId)?.label.includes('BlackHole')
  const allSystemsReady = isBlackHoleSelected && backendConnected && scarlettAudio.scarlettInfo.connected

  return (
    <div className="bg-black border-2 border-purple-600 rounded-lg p-6 shadow-lg shadow-purple-900/50">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Radio className="w-7 h-7 text-purple-400" />
        Audio Control Center
        {allSystemsReady && (
          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold">ALL SYSTEMS GO</span>
        )}
      </h2>

      {/* 5-Box Status Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {/* Microphone Status */}
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="flex flex-col items-center text-center">
            {isBlackHoleSelected ? (
              <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400 mb-1" />
            )}
            <p className="text-xs text-gray-400">Microphone</p>
            <p className="text-xs font-semibold text-white truncate w-full">
              {availableMicrophones.find(m => m.deviceId === selectedMicrophoneId)?.label.split('(')[0].slice(0, 12) || 'None'}
            </p>
          </div>
        </div>

        {/* BetaBot Status */}
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="flex flex-col items-center text-center">
            {speechRecognition.isListening ? (
              <CheckCircle className="w-5 h-5 text-green-400 mb-1 animate-pulse" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-500 mb-1" />
            )}
            <p className="text-xs text-gray-400">BetaBot</p>
            <p className={`text-xs font-semibold ${speechRecognition.isListening ? 'text-green-400' : 'text-gray-500'}`}>
              {speechRecognition.isListening ? (tts.isSpeaking ? 'Speaking' : 'Listening') : 'Off'}
            </p>
          </div>
        </div>

        {/* Discord Status */}
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="flex flex-col items-center text-center">
            {discordPanelListening ? (
              <CheckCircle className="w-5 h-5 text-purple-400 mb-1 animate-pulse" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-500 mb-1" />
            )}
            <p className="text-xs text-gray-400">Discord</p>
            <p className={`text-xs font-semibold ${discordPanelListening ? 'text-purple-400' : 'text-gray-500'}`}>
              {discordPanelListening ? 'Listening' : 'Off'}
            </p>
          </div>
        </div>

        {/* Scarlett Status */}
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="flex flex-col items-center text-center">
            {scarlettAudio.scarlettInfo.connected ? (
              <CheckCircle className="w-5 h-5 text-blue-400 mb-1" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mb-1" />
            )}
            <p className="text-xs text-gray-400">Scarlett</p>
            <p className={`text-xs font-semibold ${scarlettAudio.scarlettInfo.connected ? 'text-blue-400' : 'text-red-500'}`}>
              {scarlettAudio.scarlettInfo.connected ? 'Connected' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-gray-900 rounded-lg p-2 border border-gray-700">
          <div className="flex flex-col items-center text-center">
            {backendConnected ? (
              <Server className="w-5 h-5 text-green-400 mb-1" />
            ) : (
              <Server className="w-5 h-5 text-red-500 mb-1" />
            )}
            <p className="text-xs text-gray-400">Backend</p>
            <p className={`text-xs font-semibold ${backendConnected ? 'text-green-400' : 'text-red-500'}`}>
              {backendConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* System Health Check */}
      {scarlettAudio.routingStatus && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-2">🔊 Audio Routing Status</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {scarlettAudio.routingStatus.blackhole ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              <span className="text-gray-300">BlackHole 2ch</span>
            </div>
            <div className="flex items-center gap-1">
              {scarlettAudio.routingStatus.loopback ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              <span className="text-gray-300">Loopback Audio</span>
            </div>
            <div className="flex items-center gap-1">
              {scarlettAudio.routingStatus.multiOutput ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              <span className="text-gray-300">Multi-Output</span>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Selection */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          🎤 Step 1: Select Audio Input Device
        </label>
        <select
          value={selectedMicrophoneId}
          onChange={(e) => setSelectedMicrophoneId(e.target.value)}
          disabled={speechRecognition.isListening}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableMicrophones.length === 0 ? (
            <option value="">No microphones detected</option>
          ) : (
            availableMicrophones.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))
          )}
        </select>
        {!isBlackHoleSelected && selectedMicrophoneId && (
          <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Select "BlackHole 2ch" to capture Discord + System Audio
          </p>
        )}
      </div>

      {/* Primary Controls */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={handleToggleBetaBotSession}
          disabled={!selectedMicrophoneId}
          className={`py-4 font-bold text-base rounded-lg transition-colors flex flex-col items-center justify-center gap-2 shadow-lg ${
            speechRecognition.isListening
              ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50 text-white'
              : 'bg-green-600 hover:bg-green-700 shadow-green-900/50 text-white disabled:bg-gray-700 disabled:shadow-none disabled:text-gray-400'
          }`}
        >
          <Mic className="w-6 h-6" />
          <span className="text-sm">{speechRecognition.isListening ? 'STOP' : 'START'}</span>
          <span className="text-xs opacity-75">BetaBot</span>
        </button>

        <button
          onClick={handleToggleDiscordListening}
          disabled={!discordAudio.state.connected || !speechRecognition.isListening}
          className={`py-4 font-bold text-base rounded-lg transition-colors flex flex-col items-center justify-center gap-2 shadow-lg ${
            discordPanelListening
              ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/50 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-900 disabled:opacity-50 disabled:text-gray-500'
          }`}
        >
          <Radio className="w-6 h-6" />
          <span className="text-sm">{discordPanelListening ? 'ON' : 'OFF'}</span>
          <span className="text-xs opacity-75">Discord</span>
        </button>

        <button
          onClick={handleTestAudio}
          disabled={tts.isSpeaking}
          className="py-4 font-bold text-base rounded-lg transition-colors flex flex-col items-center justify-center gap-2 shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-900/50 text-white disabled:bg-gray-700 disabled:shadow-none disabled:text-gray-400"
        >
          <Activity className="w-6 h-6" />
          <span className="text-sm">TEST</span>
          <span className="text-xs opacity-75">Audio</span>
        </button>
      </div>

      {/* Status Messages */}
      {!backendConnected && (
        <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
          <p className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Backend Server Offline
          </p>
          <p className="text-xs mt-1">Run: cd /Users/ibrahim/thelivestreamshow/backend && npm start</p>
        </div>
      )}

      {!scarlettAudio.scarlettInfo.connected && (
        <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300">
          <p className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Scarlett Solo Not Detected
          </p>
          <p className="text-xs mt-1">Make sure Scarlett Solo 4th Gen is connected via USB</p>
        </div>
      )}

      {!isBlackHoleSelected && selectedMicrophoneId && (
        <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-sm text-yellow-300">
          <p className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Wrong Microphone Selected
          </p>
          <p className="text-xs mt-1">Select "BlackHole 2ch" to capture Discord panel audio</p>
        </div>
      )}

      {allSystemsReady && !speechRecognition.isListening && (
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
          <p className="font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            All Systems Ready
          </p>
          <p className="text-xs mt-1">
            1. Click "START BetaBot"<br />
            2. Click "ON Discord" to enable Discord listening<br />
            3. Use "TEST Audio" to verify audio flow
          </p>
        </div>
      )}

      {speechRecognition.isListening && (
        <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm text-purple-300">
          <p className="font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse" />
            Live Session Active
          </p>
          <p className="text-xs mt-1">
            {discordPanelListening
              ? '✅ BetaBot is listening and can hear Discord panel'
              : '⚠️ Enable Discord listening to hear panel members'}
          </p>
        </div>
      )}
    </div>
  )
}
