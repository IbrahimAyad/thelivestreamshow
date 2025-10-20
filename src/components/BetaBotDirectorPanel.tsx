import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Meh, Smile, Flame, Mail, ArrowLeft, ArrowRight, Move, EyeOff, Home, Lock } from 'lucide-react'
import { useAutomationEngine } from '../hooks/useAutomationEngine'

interface BetaBotMood {
  id: string
  mood: 'neutral' | 'bored' | 'amused' | 'spicy'
  show_incoming: boolean
  incoming_count: number
  movement?: 'home' | 'run_left' | 'run_right' | 'bounce' | 'hide'
  updated_at: string
}

export function BetaBotDirectorPanel() {
  const [moodState, setMoodState] = useState<BetaBotMood | null>(null)
  const [loading, setLoading] = useState(true)
  const [overrideDuration, setOverrideDuration] = useState(5) // Minutes
  const [manualOverrideActive, setManualOverrideActive] = useState(false)
  const [overrideTimeRemaining, setOverrideTimeRemaining] = useState(0) // Seconds

  // Get AI Coordinator for mood management
  const { aiCoordinator } = useAutomationEngine()

  useEffect(() => {
    loadMoodState()

    const channel = supabase
      .channel('betabot_mood_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'betabot_mood'
      }, () => {
        loadMoodState()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Poll manual override status
  useEffect(() => {
    if (!aiCoordinator) return

    const checkOverrideStatus = () => {
      const moodManager = aiCoordinator.getMoodManager()
      const isActive = moodManager.isManualOverrideActive()
      const timeRemaining = moodManager.getManualOverrideTimeRemaining()

      setManualOverrideActive(isActive)
      setOverrideTimeRemaining(timeRemaining)
    }

    // Check immediately
    checkOverrideStatus()

    // Poll every second
    const interval = setInterval(checkOverrideStatus, 1000)

    return () => clearInterval(interval)
  }, [aiCoordinator])

  const loadMoodState = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('betabot_mood')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('❌ Failed to load BetaBot mood:', error)
      setLoading(false)
      return
    }

    if (data) {
      console.log('✅ BetaBot mood loaded:', data)
      setMoodState(data as BetaBotMood)
      setLoading(false)
    } else {
      console.warn('⚠️ No mood data found in database - creating default row...')
      // Create default row if it doesn't exist
      const { data: newData, error: insertError } = await supabase
        .from('betabot_mood')
        .insert({
          mood: 'neutral',
          show_incoming: false,
          incoming_count: 0,
          movement: 'home'
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to create default mood row:', insertError)
      } else if (newData) {
        console.log('✅ Created default mood row:', newData)
        setMoodState(newData as BetaBotMood)
      }
      setLoading(false)
    }
  }

  const setMood = async (mood: 'neutral' | 'bored' | 'amused' | 'spicy') => {
    console.log('🎭 Mood button clicked:', mood, 'Current state:', moodState)

    if (!moodState) {
      console.error('❌ Cannot set mood - moodState is null')
      return
    }

    // Use Mood Manager with manual override if AI Coordinator available
    if (aiCoordinator) {
      console.log(`🎮 Setting mood via MoodManager with ${overrideDuration}min manual override`)
      const moodManager = aiCoordinator.getMoodManager()
      const result = await moodManager.setMood(mood as any, 'manual', overrideDuration)

      if (result.status === 'applied') {
        console.log(`✅ Mood set to ${mood} with ${overrideDuration}min manual override`)
        setManualOverrideActive(true)
      } else {
        console.warn(`⚠️ Mood change ${result.status}: ${result.reason}`)
      }
    } else {
      // Fallback to direct update if coordinator not available
      console.log('⚠️ AICoordinator not available, using direct Supabase update')
      console.log('🔄 Updating mood to:', mood)
      const { error } = await supabase
        .from('betabot_mood')
        .update({
          mood,
          updated_at: new Date().toISOString()
        })
        .eq('id', moodState.id)

      if (error) {
        console.error('❌ Failed to update mood:', error)
      } else {
        console.log('✅ Mood updated successfully to:', mood)
        // Immediately update local state for instant UI feedback
        setMoodState({ ...moodState, mood, updated_at: new Date().toISOString() })
      }
    }
  }

  const clearManualOverride = () => {
    if (aiCoordinator) {
      const moodManager = aiCoordinator.getMoodManager()
      moodManager.clearManualOverride()
      setManualOverrideActive(false)
      console.log('🔓 Manual override cleared early')
    }
  }

  const toggleIncoming = async () => {
    if (!moodState) return

    const newShowIncoming = !moodState.show_incoming
    const { error } = await supabase
      .from('betabot_mood')
      .update({
        show_incoming: newShowIncoming,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodState.id)

    if (!error) {
      // Immediately update local state
      setMoodState({ ...moodState, show_incoming: newShowIncoming, updated_at: new Date().toISOString() })
    }
  }

  const updateIncomingCount = async (count: number) => {
    if (!moodState) return

    const newCount = Math.max(0, count)
    const { error } = await supabase
      .from('betabot_mood')
      .update({
        incoming_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodState.id)

    if (!error) {
      // Immediately update local state
      setMoodState({ ...moodState, incoming_count: newCount, updated_at: new Date().toISOString() })
    }
  }

  const setMovement = async (movement: 'home' | 'run_left' | 'run_right' | 'bounce' | 'hide') => {
    console.log('🎯 Movement button clicked:', movement, 'Current moodState:', moodState)

    if (!moodState) {
      console.error('❌ Cannot set movement - moodState is null')
      alert('Error: Movement system not loaded yet. Please wait a moment and try again.')
      return
    }

    console.log('🔄 Updating movement to:', movement, 'for row ID:', moodState.id)
    const { error } = await supabase
      .from('betabot_mood')
      .update({
        movement,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodState.id)

    if (error) {
      console.error('❌ Failed to update movement:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert(`Failed to update movement: ${error.message}. Have you run the database migration?`)
    } else {
      console.log('✅ Movement updated successfully to:', movement)
      // Immediately update local state for instant UI feedback
      setMoodState({ ...moodState, movement, updated_at: new Date().toISOString() })
    }
  }

  const MOOD_OPTIONS = [
    { value: 'neutral', label: 'Neutral', icon: Film, color: 'red', description: 'Default calm state' },
    { value: 'bored', label: 'Bored', icon: Meh, color: 'gray', description: 'Sleepy & unimpressed' },
    { value: 'amused', label: 'Amused', icon: Smile, color: 'yellow', description: 'Happy & entertained' },
    { value: 'spicy', label: 'Spicy', icon: Flame, color: 'orange', description: 'Controversial & nervous' },
  ] as const

  const MOVEMENT_OPTIONS = [
    { value: 'home', label: 'Home', icon: Home, color: 'blue', description: 'Center position' },
    { value: 'run_left', label: 'Run Left', icon: ArrowLeft, color: 'purple', description: 'Zip to left edge' },
    { value: 'run_right', label: 'Run Right', icon: ArrowRight, color: 'purple', description: 'Race to right' },
    { value: 'bounce', label: 'Bounce', icon: Move, color: 'green', description: 'Bounce around' },
    { value: 'hide', label: 'Hide', icon: EyeOff, color: 'gray', description: 'Run off screen' },
  ] as const

  const currentMood = moodState?.mood || 'neutral'
  const currentMovement = moodState?.movement || 'home'

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        🎬 BetaBot Director Controls
      </h2>

      {loading && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded text-center">
          <p className="text-blue-300 text-sm">⏳ Loading BetaBot mood system...</p>
        </div>
      )}

      {!loading && !moodState && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded">
          <p className="text-red-300 font-semibold text-sm">❌ Failed to connect to database</p>
          <p className="text-red-400 text-xs mt-1">Check browser console for errors</p>
        </div>
      )}

      {/* Manual Override Controls */}
      {aiCoordinator && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Manual Override Control
          </h3>

          {/* Override Duration Selector */}
          <div className="mb-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
            <label className="text-sm text-gray-400 block mb-2">Override Duration (minutes):</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                value={overrideDuration}
                onChange={(e) => setOverrideDuration(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold min-w-[60px] text-center">{overrideDuration} min</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Manual mood changes will block AI suggestions for this duration
            </p>
          </div>

          {/* Override Status Display */}
          {manualOverrideActive && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 font-semibold text-sm">Manual Override Active</span>
                </div>
                <span className="text-red-400 font-mono text-sm">
                  {Math.floor(overrideTimeRemaining / 60)}:{(overrideTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={clearManualOverride}
                className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded transition-colors"
              >
                Clear Override Early
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mood Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">🎭 Set BetaBot Mood</h3>
        <div className="grid grid-cols-2 gap-3">
          {MOOD_OPTIONS.map((mood) => {
            const Icon = mood.icon
            const isActive = currentMood === mood.value

            return (
              <button
                key={mood.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🖱️ Button physically clicked:', mood.value)
                  setMood(mood.value)
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isActive
                    ? mood.color === 'red' ? 'bg-red-900/30 border-red-500' :
                      mood.color === 'gray' ? 'bg-gray-700/30 border-gray-400' :
                      mood.color === 'yellow' ? 'bg-yellow-900/30 border-yellow-400' :
                      'bg-orange-900/30 border-orange-500'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    isActive
                      ? mood.color === 'red' ? 'text-red-400' :
                        mood.color === 'gray' ? 'text-gray-300' :
                        mood.color === 'yellow' ? 'text-yellow-400' :
                        'text-orange-400'
                      : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-bold text-sm mb-1 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {mood.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mood.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Movement Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">🎯 BetaBot Movement</h3>
        <div className="grid grid-cols-2 gap-3">
          {MOVEMENT_OPTIONS.map((movement) => {
            const Icon = movement.icon
            const isActive = currentMovement === movement.value

            return (
              <button
                key={movement.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🖱️ Movement button clicked:', movement.value)
                  setMovement(movement.value)
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isActive
                    ? movement.color === 'blue' ? 'bg-blue-900/30 border-blue-500' :
                      movement.color === 'purple' ? 'bg-purple-900/30 border-purple-500' :
                      movement.color === 'green' ? 'bg-green-900/30 border-green-500' :
                      'bg-gray-700/30 border-gray-400'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    isActive
                      ? movement.color === 'blue' ? 'text-blue-400' :
                        movement.color === 'purple' ? 'text-purple-400' :
                        movement.color === 'green' ? 'text-green-400' :
                        'text-gray-300'
                      : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-bold text-sm mb-1 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {movement.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {movement.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Incoming Question Alert */}
      <div className="p-4 rounded-lg border-2 border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-300">Incoming Question Alert</h3>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🖱️ Toggle incoming clicked')
              toggleIncoming()
            }}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              moodState?.show_incoming
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {moodState?.show_incoming ? 'SHOWING' : 'HIDDEN'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Question Count:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ Decrease count clicked')
                updateIncomingCount((moodState?.incoming_count || 0) - 1)
              }}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold"
            >
              −
            </button>
            <span className="text-2xl font-bold text-white min-w-[40px] text-center">
              {moodState?.incoming_count || 0}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🖱️ Increase count clicked')
                updateIncomingCount((moodState?.incoming_count || 0) + 1)
              }}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-300">
        <p className="font-semibold">🎬 Director's Notes</p>
        <p className="text-xs mt-1">Control BetaBot's personality during the show. Use moods to react to conversations and create theatrical moments!</p>
      </div>
    </div>
  )
}
