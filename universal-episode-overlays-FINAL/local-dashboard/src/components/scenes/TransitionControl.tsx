import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Shuffle, Play } from 'lucide-react'
import type { Transition } from '../../lib/supabase'

export function TransitionControl() {
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null)
  const [duration, setDuration] = useState(1000)
  const [assignedHotkey, setAssignedHotkey] = useState('')

  useEffect(() => {
    loadTransitions()
  }, [])

  const loadTransitions = async () => {
    const { data } = await supabase
      .from('transitions')
      .select('*')
      .order('name')
    
    if (data) {
      setTransitions(data as Transition[])
      if (data.length > 0) setSelectedTransition(data[0] as Transition)
    }
  }

  const applyTransition = async () => {
    if (!selectedTransition) return

    // Apply transition: selectedTransition.name with duration
    alert(`Transition "${selectedTransition.name}" will be applied with ${duration}ms duration`)
  }

  const saveHotkey = async () => {
    if (!selectedTransition || !assignedHotkey) return

    const updatedConfig = {
      ...selectedTransition.config,
      hotkey: assignedHotkey
    }

    await supabase
      .from('transitions')
      .update({ config: updatedConfig })
      .eq('id', selectedTransition.id)

    alert(`Hotkey "${assignedHotkey}" assigned to ${selectedTransition.name}`)
    loadTransitions()
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Shuffle className="w-5 h-5 text-purple-500" />
        Transition Control
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {transitions.map(transition => (
          <button
            key={transition.id}
            onClick={() => setSelectedTransition(transition)}
            className={`p-4 rounded border text-left ${
              selectedTransition?.id === transition.id
                ? 'bg-purple-600/20 border-purple-500'
                : 'bg-[#1a1a1a] border-[#3a3a3a] hover:border-purple-500/50'
            }`}
          >
            <div className="font-semibold">{transition.name}</div>
            <div className="text-xs text-gray-400 mt-1 capitalize">{transition.type}</div>
            <div className="text-xs text-gray-500 mt-1">Duration: {transition.duration_ms}ms</div>
          </button>
        ))}
      </div>

      {selectedTransition && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Transition Duration (ms)</label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-400 mt-1">{duration}ms</div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Assign Hotkey (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Ctrl+Shift+T"
                value={assignedHotkey}
                onChange={(e) => setAssignedHotkey(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] rounded"
              />
              <button
                onClick={saveHotkey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
              >
                Save Hotkey
              </button>
            </div>
          </div>

          <button
            onClick={applyTransition}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-3 rounded font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Apply Transition
          </button>

          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded text-sm">
            <div className="font-semibold mb-1">Preview</div>
            <div className="text-gray-400">
              {selectedTransition.name} will transition over {duration}ms using {selectedTransition.type} effect
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
