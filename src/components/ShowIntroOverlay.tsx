/**
 * ShowIntroOverlay - Broadcast display for automated show intro sequence
 * 
 * Subscribes to show_intro_state via Supabase real-time
 * Displays DJ visualizer and tomato game based on sequence state
 */

import { useEffect, useState } from 'react'
import { supabase, type ShowIntroState } from '@/lib/supabase'

export function ShowIntroOverlay() {
  const [introState, setIntroState] = useState<ShowIntroState | null>(null)

  useEffect(() => {
    // Load initial state
    const loadState = async () => {
      const { data, error } = await supabase
        .from('show_intro_state')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single()

      if (error) {
        console.error('[ShowIntroOverlay] Failed to load state:', error)
        return
      }

      if (data) {
        setIntroState(data as ShowIntroState)
        console.log('[ShowIntroOverlay] Initial state loaded:', data.current_step)
      }
    }

    loadState()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('show_intro_overlay_sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'show_intro_state'
      }, (payload) => {
        const newState = payload.new as ShowIntroState
        setIntroState(newState)
        console.log('[ShowIntroOverlay] State updated:', newState.current_step)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (!introState || !introState.is_running) {
    return null // Don't show anything when sequence isn't running
  }

  return (
    <>
      {/* DJ Visualizer - Full screen iframe (same z-index as BroadcastGraphicsDisplay) */}
      {introState.show_dj_visualizer && (
        <div
          className="fullscreen-html-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            animation: 'fadeIn 300ms ease-out',
          }}
        >
          <iframe
            src="/animations/ai-dj-visualizer.html"
            className="fullscreen-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title="AI DJ Visualizer"
          />
        </div>
      )}

      {/* Tomato Game - Full screen iframe (higher z-index) */}
      {introState.show_tomato_game && (
        <div
          className="fullscreen-html-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.95)',
            animation: 'fadeIn 300ms ease-out',
          }}
        >
          <iframe
            src="/brb-tomato-game.html"
            className="fullscreen-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Tomato Game"
          />
        </div>
      )}

      {/* Optional: Step indicator for debugging */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            padding: '10px 15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
            border: '1px solid #00ff00',
          }}
        >
          <div>Step: {introState.current_step}</div>
          <div>Time: {Math.floor(introState.elapsed_time)}s</div>
          <div>DJ: {introState.show_dj_visualizer ? 'ON' : 'OFF'}</div>
          <div>Game: {introState.show_tomato_game ? 'ON' : 'OFF'}</div>
        </div>
      )}

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fullscreen-html-overlay {
          animation: fadeIn 300ms ease-out;
        }

        .fullscreen-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
      `}</style>
    </>
  )
}
