/**
 * ShowIntroController - LEGACY COMPONENT (DISABLED)
 * 
 * This component creates its own audio system that conflicts with the global MusicProvider.
 * It has been disabled to prevent audio issues. Use the global music player instead.
 */

import { AlertCircle } from 'lucide-react'

export function ShowIntroController({ className = '' }: { className?: string }) {
  // Hard-disabled - conflicts with global audio
  if (import.meta.env.VITE_ENABLE_LEGACY_SHOW !== 'true') {
    console.info('[ShowIntroController] DISABLED - conflicts with global audio system')
    return (
      <div className={`bg-yellow-900/20 border-2 border-yellow-500/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-bold text-yellow-300">Show Intro Controller Disabled</h3>
        </div>
        <p className="text-sm text-yellow-200/80">
          This feature has been temporarily disabled to prevent audio conflicts with the global music system.
          Use the Studio music library and Dashboard transport controls for playback.
        </p>
        <p className="text-xs text-yellow-200/60 mt-2">
          To re-enable (not recommended): Set <code className="bg-black/30 px-1 rounded">VITE_ENABLE_LEGACY_SHOW=true</code> in .env.local
        </p>
      </div>
    )
  }

  // Original component code would go here (never reached)
  return null
}
