/**
 * Loop Roll Hook
 * Manages loop roll state and provides instant looping functions
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { LoopRollLength } from '@/utils/studio/loopRoll'
import { getLoopRollDuration } from '@/utils/studio/loopRoll'

interface UseLoopRollProps {
  audioElement: HTMLAudioElement | null
  bpm: number
}

export function useLoopRoll({ audioElement, bpm }: UseLoopRollProps) {
  const [isActive, setIsActive] = useState(false)
  const [activeLength, setActiveLength] = useState<LoopRollLength>('1/4')
  const loopStartRef = useRef<number>(0)
  const loopEndRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()

  // Loop roll monitoring loop
  useEffect(() => {
    if (!isActive || !audioElement) {
      return
    }

    const monitorLoop = () => {
      const currentTime = audioElement.currentTime

      // Check if we've reached the end of the loop
      if (currentTime >= loopEndRef.current) {
        audioElement.currentTime = loopStartRef.current
      }

      animationFrameRef.current = requestAnimationFrame(monitorLoop)
    }

    animationFrameRef.current = requestAnimationFrame(monitorLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, audioElement])

  const startLoopRoll = useCallback((length: LoopRollLength) => {
    if (!audioElement) return

    const currentTime = audioElement.currentTime
    const loopDuration = getLoopRollDuration(length, bpm)

    loopStartRef.current = currentTime
    loopEndRef.current = currentTime + loopDuration

    setActiveLength(length)
    setIsActive(true)
  }, [audioElement, bpm])

  const stopLoopRoll = useCallback(() => {
    setIsActive(false)

    // Cancel the monitoring loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const toggleLoopRoll = useCallback((length: LoopRollLength) => {
    if (isActive && activeLength === length) {
      stopLoopRoll()
    } else {
      startLoopRoll(length)
    }
  }, [isActive, activeLength, startLoopRoll, stopLoopRoll])

  return {
    isActive,
    activeLength,
    startLoopRoll,
    stopLoopRoll,
    toggleLoopRoll,
  }
}
