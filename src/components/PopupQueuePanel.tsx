import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Monitor, Trash2, List, Settings, Play } from 'lucide-react'

interface ShowQuestion {
  id: string
  topic: string
  question_text: string
  tts_audio_url: string | null
  tts_generated: boolean
  position: number
  show_on_overlay: boolean
  overlay_triggered_at: string | null
}

interface PopupSettings {
  duration: number
  auto_show_next: boolean
}

export function PopupQueuePanel() {
  const [questions, setQuestions] = useState<ShowQuestion[]>([])
  const [queuedQuestions, setQueuedQuestions] = useState<string[]>([])
  const [settings, setSettings] = useState<PopupSettings>({
    duration: 15,
    auto_show_next: false
  })

  useEffect(() => {
    loadQuestions()
    loadSettings()

    const channel = supabase
      .channel('popup_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_questions'
      }, () => {
        loadQuestions()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadQuestions = async () => {
    const { data } = await supabase
      .from('show_questions')
      .select('*')
      .order('position', { ascending: true })
    
    if (data) setQuestions(data as ShowQuestion[])
  }

  const loadSettings = () => {
    const saved = localStorage.getItem('popup_settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }

  const saveSettings = (newSettings: PopupSettings) => {
    setSettings(newSettings)
    localStorage.setItem('popup_settings', JSON.stringify(newSettings))
    // Also broadcast to overlay via a settings table or localStorage sync
    window.dispatchEvent(new CustomEvent('popup-settings-changed', { detail: newSettings }))
  }

  const addToQueue = (questionId: string) => {
    if (!queuedQuestions.includes(questionId)) {
      setQueuedQuestions([...queuedQuestions, questionId])
    }
  }

  const removeFromQueue = (questionId: string) => {
    setQueuedQuestions(queuedQuestions.filter(id => id !== questionId))
  }

  const sendToOverlay = async (questionId: string) => {
    try {
      // Clear any previously shown questions
      await supabase
        .from('show_questions')
        .update({ show_on_overlay: false })
        .eq('show_on_overlay', true)

      // Set this question to show on overlay
      const { error } = await supabase
        .from('show_questions')
        .update({ 
          show_on_overlay: true,
          overlay_triggered_at: new Date().toISOString()
        })
        .eq('id', questionId)

      if (error) throw error

      // If auto-show is enabled and there are more in queue, prepare next
      if (settings.auto_show_next && queuedQuestions.length > 0) {
        // Remove from queue
        removeFromQueue(questionId)
        
        // Auto-send next question after current duration + 1 second
        if (queuedQuestions.length > 1) {
          const nextQuestionId = queuedQuestions[1]
          setTimeout(() => {
            sendToOverlay(nextQuestionId)
          }, (settings.duration + 1) * 1000)
        }
      }
    } catch (error) {
      console.error('Error sending question to overlay:', error)
      alert('Failed to send question to overlay')
    }
  }

  const sendQueueToOverlay = () => {
    if (queuedQuestions.length === 0) return
    sendToOverlay(queuedQuestions[0])
  }

  const clearQueue = () => {
    setQueuedQuestions([])
  }

  const queuedQuestionsData = questions.filter(q => queuedQuestions.includes(q.id))

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Monitor className="w-7 h-7 text-cyan-400" />
        Popup Queue Manager
      </h2>

      {/* Settings Panel */}
      <div className="mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-white">Popup Settings</h3>
        </div>

        {/* Duration Slider */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            Popup Duration: <span className="text-cyan-400 font-bold">{settings.duration}s</span>
          </label>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={settings.duration}
            onChange={(e) => saveSettings({ ...settings, duration: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Auto-show Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="auto-show"
            checked={settings.auto_show_next}
            onChange={(e) => saveSettings({ ...settings, auto_show_next: e.target.checked })}
            className="w-5 h-5 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
          />
          <label htmlFor="auto-show" className="text-gray-300 text-sm font-semibold cursor-pointer">
            Auto-show next question in queue
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-8">
          Automatically display next queued question when current one finishes
        </p>
      </div>

      {/* Queue Management */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-white">
              Question Queue ({queuedQuestions.length})
            </h3>
          </div>
          <div className="flex gap-2">
            {queuedQuestions.length > 0 && (
              <>
                <button
                  onClick={sendQueueToOverlay}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Queue
                </button>
                <button
                  onClick={clearQueue}
                  className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-semibold rounded transition-colors"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {queuedQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-900 border border-gray-700 rounded-lg">
            <p>Queue is empty. Add questions from the Show Prep panel.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {queuedQuestionsData.map((q, index) => (
              <div
                key={q.id}
                className="p-3 bg-gray-900 border border-cyan-700/30 rounded-lg hover:border-cyan-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold text-lg min-w-8">#{index + 1}</span>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">{q.topic}</div>
                    <div className="text-white text-sm">{q.question_text}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendToOverlay(q.id)}
                      className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                      title="Send now"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromQueue(q.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Questions (for quick add) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Add to Queue</h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {questions
            .filter(q => !queuedQuestions.includes(q.id))
            .slice(0, 8)
            .map((q) => (
              <button
                key={q.id}
                onClick={() => addToQueue(q.id)}
                className="p-2 text-left bg-gray-900 border border-gray-700 rounded hover:border-cyan-600 transition-colors"
              >
                <div className="text-xs text-gray-500 truncate">{q.topic}</div>
                <div className="text-sm text-white truncate">{q.question_text}</div>
              </button>
            ))}
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #00d9ff;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 217, 255, 0.6);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #00d9ff;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0, 217, 255, 0.6);
          border: none;
        }
      `}</style>
    </div>
  )
}
