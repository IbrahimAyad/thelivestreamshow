import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface Show {
  id: string
  name: string
  theme_color: string
  default_hashtag?: string
  slug: string
}

interface ShowContextType {
  currentShow: Show | null
  setCurrentShow: (show: Show | null) => void
  shows: Show[]
  loadShows: () => Promise<void>
  getThemeColor: () => string
}

const ShowContext = createContext<ShowContextType | undefined>(undefined)

export function ShowProvider({ children }: { children: ReactNode }) {
  const [currentShow, setCurrentShowState] = useState<Show | null>(null)
  const [shows, setShows] = useState<Show[]>([])

  useEffect(() => {
    loadShows()
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('currentShow')
    if (stored) {
      try {
        setCurrentShowState(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored show:', e)
      }
    }
  }, [])

  const loadShows = async () => {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('name')
    
    if (data) {
      setShows(data as Show[])
    }
  }

  const setCurrentShow = (show: Show | null) => {
    setCurrentShowState(show)
    if (show) {
      localStorage.setItem('currentShow', JSON.stringify(show))
    } else {
      localStorage.removeItem('currentShow')
    }
  }

  const getThemeColor = () => {
    return currentShow?.theme_color || '#8b5cf6' // Default purple
  }

  return (
    <ShowContext.Provider value={{
      currentShow,
      setCurrentShow,
      shows,
      loadShows,
      getThemeColor
    }}>
      {children}
    </ShowContext.Provider>
  )
}

export function useShow() {
  const context = useContext(ShowContext)
  if (context === undefined) {
    throw new Error('useShow must be used within a ShowProvider')
  }
  return context
}
