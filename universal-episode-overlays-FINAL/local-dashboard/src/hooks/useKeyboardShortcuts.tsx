import { useEffect } from 'react'
import { useScene } from '../contexts/SceneContext'
import { useLowerThird } from '../contexts/LowerThirdContext'

interface KeyboardShortcutsProps {
  sceneTemplates: any[]
  onBRB: () => void
  onStandby: () => void
  onMuteAll: () => void
  onOpenSceneSwitcher?: () => void
  onOpenShortcutsHelp?: () => void
}

export function useKeyboardShortcuts({
  sceneTemplates,
  onBRB,
  onStandby,
  onMuteAll,
  onOpenSceneSwitcher,
  onOpenShortcutsHelp
}: KeyboardShortcutsProps) {
  const { applyScene } = useScene()
  const { toggleLowerThird } = useLowerThird()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Help shortcut: ?
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onOpenShortcutsHelp?.()
        return
      }

      // Scene switcher: S
      if (e.key === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onOpenSceneSwitcher?.()
        return
      }

      // Number keys 1-9: Switch to scene templates
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 9 && sceneTemplates.length >= num) {
          e.preventDefault()
          const template = sceneTemplates[num - 1]
          if (template) {
            const config = template.config as any
            applyScene(
              template.id,
              template.name,
              config,
              config?.thumbnail_url || template.thumbnail_url
            )
          }
        }
      }

      // Emergency controls
      if (e.key === 'F1') {
        e.preventDefault()
        onBRB()
      }
      if (e.key === 'F2') {
        e.preventDefault()
        onStandby()
      }

      // Lower third toggle: L
      if (e.key === 'l' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        toggleLowerThird()
      }

      // Mute all: M
      if (e.key === 'm' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onMuteAll()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sceneTemplates, applyScene, toggleLowerThird, onBRB, onStandby, onMuteAll, onOpenSceneSwitcher, onOpenShortcutsHelp])
}
