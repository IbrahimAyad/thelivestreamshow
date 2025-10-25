import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface LowerThirdGraphic {
  id: string
  name: string
  file_url: string
  show_id?: string
  tags?: string[]
}

interface LowerThirdContextType {
  isVisible: boolean
  currentGraphic: LowerThirdGraphic | null
  availableGraphics: LowerThirdGraphic[]
  showLowerThird: (graphic: LowerThirdGraphic) => void
  hideLowerThird: () => void
  toggleLowerThird: () => void
  loadGraphics: () => Promise<void>
}

const LowerThirdContext = createContext<LowerThirdContextType | undefined>(undefined)

export function LowerThirdProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentGraphic, setCurrentGraphic] = useState<LowerThirdGraphic | null>(null)
  const [availableGraphics, setAvailableGraphics] = useState<LowerThirdGraphic[]>([])

  // Load available lower third graphics on mount
  useEffect(() => {
    loadGraphics()
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lowerThird')
    if (stored) {
      try {
        const { isVisible: storedVisible, graphic } = JSON.parse(stored)
        if (graphic) {
          setCurrentGraphic(graphic)
          setIsVisible(storedVisible)
        }
      } catch (e) {
        console.error('Failed to parse stored lower third:', e)
      }
    }
  }, [])

  const loadGraphics = async () => {
    const { data } = await supabase
      .from('media_library')
      .select('id, name, file_url, show_id, tags')
      .eq('category', 'overlay')
      .order('name')
    
    if (data) {
      setAvailableGraphics(data as LowerThirdGraphic[])
    }
  }

  const showLowerThird = (graphic: LowerThirdGraphic) => {
    setCurrentGraphic(graphic)
    setIsVisible(true)
    localStorage.setItem('lowerThird', JSON.stringify({ isVisible: true, graphic }))
  }

  const hideLowerThird = () => {
    setIsVisible(false)
    localStorage.setItem('lowerThird', JSON.stringify({ isVisible: false, graphic: currentGraphic }))
  }

  const toggleLowerThird = () => {
    if (isVisible) {
      hideLowerThird()
    } else if (currentGraphic) {
      showLowerThird(currentGraphic)
    }
  }

  return (
    <LowerThirdContext.Provider value={{
      isVisible,
      currentGraphic,
      availableGraphics,
      showLowerThird,
      hideLowerThird,
      toggleLowerThird,
      loadGraphics
    }}>
      {children}
    </LowerThirdContext.Provider>
  )
}

export function useLowerThird() {
  const context = useContext(LowerThirdContext)
  if (context === undefined) {
    throw new Error('useLowerThird must be used within a LowerThirdProvider')
  }
  return context
}
