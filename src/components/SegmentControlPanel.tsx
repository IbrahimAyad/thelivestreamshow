import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Film, Clock, Play, Pause, RotateCcw, Save } from 'lucide-react'

interface ShowSegment {
  id: string
  segment_name: string
  segment_topic: string | null
  segment_question: string | null
  is_active: boolean
  timer_seconds: number
  timer_running: boolean
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function SegmentControlPanel() {
  const [segments, setSegments] = useState<ShowSegment[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [editingTopic, setEditingTopic] = useState('')
  const [editingQuestion, setEditingQuestion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadSegments()

    const channel = supabase
      .channel('segments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_segments'
      }, () => {
        loadSegments()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning])

  const loadSegments = async () => {
    const { data } = await supabase
      .from('show_segments')
      .select('*')
      .order('created_at')
    
    if (data) {
      setSegments(data as ShowSegment[])
      const active = data.find(s => s.is_active)
      if (active) {
        setEditingTopic(active.segment_topic || '')
        setEditingQuestion(active.segment_question || '')
      }
    }
  }

  const activateSegment = async (segmentId: string) => {
    try {
      // Deactivate all segments first
      const { error: deactivateError } = await supabase
        .from('show_segments')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deactivateError) throw deactivateError;

      // Activate the selected segment
      const { error: activateError } = await supabase
        .from('show_segments')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', segmentId);

      if (activateError) throw activateError;

      // Load the new active segment's topic/question
      const newActive = segments.find(s => s.id === segmentId)
      if (newActive) {
        setEditingTopic(newActive.segment_topic || '')
        setEditingQuestion(newActive.segment_question || '')
      }

      // Reset timer when switching segments
      setElapsedTime(0);
      setIsRunning(false);
    } catch (error) {
      console.error('Error activating segment:', error);
      alert('Failed to activate segment.');
    }
  }

  const clearSegment = async () => {
    try {
      const { error } = await supabase
        .from('show_segments')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setElapsedTime(0);
      setIsRunning(false);
    } catch (error) {
      console.error('Error clearing segment:', error);
      alert('Failed to clear segment.');
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  }

  const resetTimer = () => {
    setElapsedTime(0);
    setIsRunning(false);
  }

  // Debounced auto-save for topic/question
  const saveSegmentContent = useCallback(async (segmentId: string, topic: string, question: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('show_segments')
        .update({ 
          segment_topic: topic || null,
          segment_question: question || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', segmentId)

      if (error) throw error
    } catch (error) {
      console.error('Error saving segment content:', error)
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [])

  const handleTopicChange = (value: string) => {
    setEditingTopic(value)
    
    if (saveTimeout) clearTimeout(saveTimeout)
    
    const timeout = setTimeout(() => {
      if (activeSegment) {
        saveSegmentContent(activeSegment.id, value, editingQuestion)
      }
    }, 500)
    
    setSaveTimeout(timeout)
  }

  const handleQuestionChange = (value: string) => {
    setEditingQuestion(value)
    
    if (saveTimeout) clearTimeout(saveTimeout)
    
    const timeout = setTimeout(() => {
      if (activeSegment) {
        saveSegmentContent(activeSegment.id, editingTopic, value)
      }
    }, 500)
    
    setSaveTimeout(timeout)
  }

  const activeSegment = segments.find(s => s.is_active)

  const getSegmentColor = (name: string) => {
    const colors: Record<string, string> = {
      'Intro': 'from-blue-600 to-blue-700',
      'Part 1': 'from-purple-600 to-purple-700',
      'Part 2': 'from-indigo-600 to-indigo-700',
      'Part 3': 'from-violet-600 to-violet-700',
      'Outro': 'from-pink-600 to-pink-700'
    }
    return colors[name] || 'from-gray-600 to-gray-700'
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Film className="w-7 h-7 text-indigo-400" />
        Segment Control
      </h2>

      {/* Current Segment Display with Timer */}
      {activeSegment && (
        <div className="mb-4 p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-2 border-indigo-400 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-indigo-300 font-semibold">CURRENT SEGMENT</p>
                {isSaving && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <Save className="w-3 h-3" />
                    Saving...
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white">{activeSegment.segment_name}</p>
            </div>
            <Clock className="w-8 h-8 text-indigo-400" />
          </div>

          {/* Topic Input */}
          <div className="mb-3">
            <label className="block text-xs text-indigo-300 font-semibold mb-1">TOPIC</label>
            <input
              type="text"
              value={editingTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full bg-black/30 border border-indigo-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-400 transition-colors"
              placeholder="e.g., Welcome to the Show"
              maxLength={100}
            />
          </div>

          {/* Question Textarea */}
          <div className="mb-3">
            <label className="block text-xs text-indigo-300 font-semibold mb-1">QUESTION</label>
            <textarea
              value={editingQuestion}
              onChange={(e) => handleQuestionChange(e.target.value)}
              className="w-full bg-black/30 border border-indigo-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
              placeholder="e.g., What is BetaBot and how does it work?"
              rows={3}
              maxLength={500}
            />
          </div>
          
          {/* Timer Display */}
          <div className="bg-black/30 rounded-lg p-3 mb-2">
            <div className="text-center">
              <p className="text-xs text-indigo-300 mb-1">ELAPSED TIME</p>
              <p className="text-3xl font-mono font-bold text-white">{formatTime(elapsedTime)}</p>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex gap-2">
            <button
              onClick={toggleTimer}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isRunning 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
            >
              {isRunning ? (
                <><Pause className="w-4 h-4" /> Pause</>
              ) : (
                <><Play className="w-4 h-4" /> Start</>
              )}
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Segment Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {segments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => activateSegment(segment.id)}
            className={`h-20 rounded-lg bg-gradient-to-br ${getSegmentColor(segment.segment_name)} hover:brightness-110 text-white font-bold text-lg transition-all ${
              segment.is_active ? 'ring-4 ring-green-400 scale-105 shadow-lg shadow-green-500/50' : ''
            }`}
            title={`Switch to ${segment.segment_name} (Ctrl+${segments.indexOf(segment) + 1})`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span>{segment.segment_name}</span>
              {segment.segment_topic && (
                <span className="block text-xs mt-1 text-white/70 font-normal truncate max-w-full px-2">
                  {segment.segment_topic}
                </span>
              )}
              {segment.is_active && (
                <span className="block text-xs mt-1 text-green-300 font-bold">ACTIVE NOW</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Clear Button */}
      <button
        onClick={clearSegment}
        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
      >
        Clear Segment
      </button>

      <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-sm text-indigo-300">
        <p className="font-semibold">Professional Segments</p>
        <p className="text-xs mt-1">Structure your discussion show like a professional production</p>
      </div>
    </div>
  )
}
