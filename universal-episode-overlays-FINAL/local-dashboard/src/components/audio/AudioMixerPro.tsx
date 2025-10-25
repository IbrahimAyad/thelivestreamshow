import { Volume2, AlertCircle } from 'lucide-react'
import { AudioMixer } from '../AudioMixer'
import { useOBSWebSocket } from '../../hooks/useOBSWebSocket'

export function AudioMixerPro() {
  const obs = useOBSWebSocket()

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-blue-500" />
          Professional Audio Mixer
        </h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded ${
          obs.connected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            obs.connected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-sm">{obs.connected ? 'OBS Connected' : 'OBS Disconnected'}</span>
        </div>
      </div>

      {!obs.connected && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-1">OBS Not Connected</p>
            <p>Connect to OBS in the Sources tab to control audio levels in real-time.</p>
          </div>
        </div>
      )}

      <AudioMixer
        inputs={obs.inputs}
        onSetMute={obs.setInputMute}
        onSetVolume={obs.setInputVolume}
        getInputVolume={obs.getInputVolume}
        disabled={!obs.connected}
      />
    </div>
  )
}
