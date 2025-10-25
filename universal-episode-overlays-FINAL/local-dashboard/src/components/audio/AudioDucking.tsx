import { Volume2, Info } from 'lucide-react'

export function AudioDucking() {
  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <div className="flex items-center gap-3 mb-6">
        <Volume2 className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-xl font-semibold text-white">Audio Ducking</h2>
          <p className="text-sm text-gray-400">Configure in OBS Studio</p>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold mb-2">What is Audio Ducking?</p>
            <p>Ducking automatically reduces background music volume when you speak into the microphone, ensuring your voice is always clear and prominent in the mix.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
        <h3 className="text-white font-semibold mb-3">Setup Instructions in OBS</h3>
        <ol className="space-y-3 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-purple-400 font-semibold">1.</span>
            <span>In OBS, right-click on your <strong>Background Music</strong> source in the Audio Mixer</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400 font-semibold">2.</span>
            <span>Select <strong>Filters</strong> from the menu</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400 font-semibold">3.</span>
            <span>Click the <strong>+</strong> button and add a <strong>Compressor</strong> filter</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400 font-semibold">4.</span>
            <span>Enable <strong>Sidechain/Ducking Source</strong> and select your <strong>Microphone</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400 font-semibold">5.</span>
            <span>Configure the following settings:</span>
          </li>
        </ol>
        
        <div className="mt-4 bg-[#0a0a0a] rounded p-3 font-mono text-xs text-gray-400">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-purple-400">Ratio:</span> 32:1</div>
            <div><span className="text-purple-400">Threshold:</span> -40 dB</div>
            <div><span className="text-purple-400">Attack:</span> 100 ms</div>
            <div><span className="text-purple-400">Release:</span> 500 ms</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 italic">
          Note: These settings provide a balanced ducking effect. Adjust the threshold and ratio to your preference.
        </p>
      </div>
    </div>
  )
}
