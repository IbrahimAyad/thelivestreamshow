import { useState, useEffect } from 'react'
import { Clock, Play, Pause, RotateCcw, Plus } from 'lucide-react'
import { supabase, TimerConfig } from '../lib/supabase'

export const TimerPanel = () => {
  const [timers, setTimers] = useState<TimerConfig[]>([])
  const [showAddTimer, setShowAddTimer] = useState(false)
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerDuration, setNewTimerDuration] = useState(600)
  const [newTimerType, setNewTimerType] = useState<'countdown' | 'countup'>('countdown')

  useEffect(() => {
    loadTimers()

    const subscription = supabase
      .channel('timer_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timer_configs' }, () => {
        loadTimers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Update running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      timers.forEach(async (timer) => {
        if (timer.is_running) {
          const newValue = timer.timer_type === 'countdown' 
            ? Math.max(0, timer.current_value - 1)
            : timer.current_value + 1

          await supabase
            .from('timer_configs')
            .update({ 
              current_value: newValue,
              is_running: timer.timer_type === 'countdown' && newValue === 0 ? false : timer.is_running
            })
            .eq('id', timer.id)
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timers])

  const loadTimers = async () => {
    const { data } = await supabase
      .from('timer_configs')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (data) setTimers(data)
  }

  const addTimer = async () => {
    if (!newTimerName) return

    await supabase.from('timer_configs').insert({
      name: newTimerName,
      timer_type: newTimerType,
      duration_seconds: newTimerType === 'countdown' ? newTimerDuration : null,
      current_value: newTimerType === 'countdown' ? newTimerDuration : 0,
      is_running: false
    })

    setNewTimerName('')
    setNewTimerDuration(600)
    setShowAddTimer(false)
  }

  const toggleTimer = async (timer: TimerConfig) => {
    await supabase
      .from('timer_configs')
      .update({ is_running: !timer.is_running })
      .eq('id', timer.id)
  }

  const resetTimer = async (timer: TimerConfig) => {
    await supabase
      .from('timer_configs')
      .update({ 
        current_value: timer.timer_type === 'countdown' ? (timer.duration_seconds || 0) : 0,
        is_running: false
      })
      .eq('id', timer.id)
  }

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = (timer: TimerConfig): string => {
    if (timer.timer_type === 'countdown' && timer.duration_seconds) {
      const percentage = (timer.current_value / timer.duration_seconds) * 100
      if (percentage <= 10) return 'text-red-500'
      if (percentage <= 30) return 'text-yellow-500'
      return 'text-green-500'
    }
    return 'text-blue-500'
  }

  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timers
        </h2>
        <button
          onClick={() => setShowAddTimer(!showAddTimer)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddTimer && (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3 mb-4 space-y-3">
          <input
            type="text"
            value={newTimerName}
            onChange={(e) => setNewTimerName(e.target.value)}
            placeholder="Timer name"
            className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setNewTimerType('countdown')}
              className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
                newTimerType === 'countdown' ? 'bg-blue-600 text-white' : 'bg-[#0a0a0a] text-gray-400'
              }`}
            >
              Countdown
            </button>
            <button
              onClick={() => setNewTimerType('countup')}
              className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
                newTimerType === 'countup' ? 'bg-blue-600 text-white' : 'bg-[#0a0a0a] text-gray-400'
              }`}
            >
              Count Up
            </button>
          </div>
          {newTimerType === 'countdown' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={newTimerDuration}
                onChange={(e) => setNewTimerDuration(parseInt(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-white text-sm"
              />
            </div>
          )}
          <button
            onClick={addTimer}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
          >
            Create Timer
          </button>
        </div>
      )}

      <div className="space-y-2">
        {timers.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No timers created yet.</p>
        )}

        {timers.map((timer) => (
          <div key={timer.id} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">{timer.name}</span>
              <span className="text-xs text-gray-500 uppercase">{timer.timer_type}</span>
            </div>
            <div className={`text-4xl font-bold font-mono mb-3 ${getTimerColor(timer)}`}>
              {formatTime(timer.current_value)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleTimer(timer)}
                className={`flex-1 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 ${
                  timer.is_running ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {timer.is_running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {timer.is_running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => resetTimer(timer)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
