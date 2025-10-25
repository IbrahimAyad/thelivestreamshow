import { Monitor } from 'lucide-react'
import { OBSScene } from '../hooks/useOBSWebSocket'

interface SceneSwitcherProps {
  scenes: OBSScene[]
  currentScene: string | null
  onSwitchScene: (sceneName: string) => void
  disabled: boolean
}

export const SceneSwitcher = ({ scenes, currentScene, onSwitchScene, disabled }: SceneSwitcherProps) => {
  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Monitor className="w-5 h-5" />
        Scene Control
      </h2>

      {scenes.length === 0 && (
        <p className="text-gray-500 text-sm">No scenes available. Connect to OBS first.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {scenes.map((scene) => {
          const isActive = scene.sceneName === currentScene
          return (
            <button
              key={scene.sceneUuid}
              onClick={() => onSwitchScene(scene.sceneName)}
              disabled={disabled || isActive}
              className={`p-3 rounded font-semibold transition-all ${
                isActive
                  ? 'bg-red-600 text-white border-2 border-red-400'
                  : 'bg-[#1a1a1a] text-gray-300 border border-[#3a3a3a] hover:border-blue-500 hover:bg-[#1e1e1e]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isActive && (
                <div className="text-xs uppercase tracking-wider mb-1 text-red-200">LIVE</div>
              )}
              {scene.sceneName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
