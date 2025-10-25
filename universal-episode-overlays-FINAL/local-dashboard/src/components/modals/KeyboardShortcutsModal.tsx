import { X, Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  const shortcuts = [
    {
      category: 'Scene Control',
      items: [
        { keys: ['1', '2', '3', '...', '9'], description: 'Switch to scene template 1-9' },
        { keys: ['S'], description: 'Open scene switcher modal' },
      ]
    },
    {
      category: 'Emergency Controls',
      items: [
        { keys: ['F1'], description: 'Show BRB screen' },
        { keys: ['F2'], description: 'Show Standby/Starting Soon screen' },
        { keys: ['ESC'], description: 'Cancel/Close modal' },
      ]
    },
    {
      category: 'Media Controls',
      items: [
        { keys: ['M'], description: 'Mute/Unmute all audio' },
        { keys: ['L'], description: 'Toggle lower third overlay' },
        { keys: ['Space'], description: 'Play/Pause current media' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'L'], description: 'Go to Live Control tab' },
        { keys: ['Ctrl', 'S'], description: 'Go to Scenes tab' },
        { keys: ['Ctrl', 'M'], description: 'Go to Media tab' },
        { keys: ['Ctrl', 'A'], description: 'Go to Audio tab' },
      ]
    },
    {
      category: 'Help',
      items: [
        { keys: ['?'], description: 'Show this shortcuts reference' },
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center justify-between py-2">
                    <span className="text-gray-300">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <kbd 
                          key={keyIdx}
                          className="px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-sm font-mono min-w-[2.5rem] text-center"
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

        {/* Footer */}
        <div className="p-6 border-t border-[#3a3a3a] bg-[#0a0a0a]">
          <p className="text-sm text-gray-400 text-center">
            Press <kbd className="px-2 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-xs">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  )
}
