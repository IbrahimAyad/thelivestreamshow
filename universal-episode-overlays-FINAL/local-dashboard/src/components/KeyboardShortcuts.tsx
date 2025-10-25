import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcuts = [
    { category: 'General', items: [
      { keys: ['?'], description: 'Show/Hide keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modals and dialogs' },
    ]},
    { category: 'Live Control', items: [
      { keys: ['Space'], description: 'Start/Stop streaming' },
      { keys: ['R'], description: 'Start/Stop recording' },
      { keys: ['M'], description: 'Mute all audio' },
      { keys: ['C'], description: 'Mark clip' },
      { keys: ['B'], description: 'Toggle BRB screen' },
    ]},
    { category: 'Scenes', items: [
      { keys: ['1'], description: 'Switch to Scene 1' },
      { keys: ['2'], description: 'Switch to Scene 2' },
      { keys: ['3'], description: 'Switch to Scene 3' },
      { keys: ['4'], description: 'Switch to Scene 4' },
      { keys: ['5'], description: 'Switch to Scene 5' },
    ]},
    { category: 'Navigation', items: [
      { keys: ['Ctrl', 'L'], description: 'Go to Live Control' },
      { keys: ['Ctrl', 'S'], description: 'Go to Scenes' },
      { keys: ['Ctrl', 'M'], description: 'Go to Media' },
      { keys: ['Ctrl', 'A'], description: 'Go to Audio' },
    ]},
    { category: 'Audio', items: [
      { keys: ['↑'], description: 'Increase mic volume' },
      { keys: ['↓'], description: 'Decrease mic volume' },
      { keys: ['F1'], description: 'Sound effect 1' },
      { keys: ['F2'], description: 'Sound effect 2' },
      { keys: ['F3'], description: 'Sound effect 3' },
    ]},
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg border-2 border-blue-500/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#3a3a3a] p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-blue-500" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-lg font-bold mb-3 text-blue-400">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-[#3a3a3a]">
                      <span className="text-gray-300">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, kidx) => (
                          <kbd
                            key={kidx}
                            className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded font-mono text-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
            <p className="text-sm text-gray-300">
              <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-xs font-mono">?</kbd> anytime to view this shortcuts panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
