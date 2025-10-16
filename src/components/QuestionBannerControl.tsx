import { useState, useEffect } from 'react'
import { supabase, QuestionBanner } from '../lib/supabase'
import { MessageSquare, Play, Pause, Gauge } from 'lucide-react'

export function QuestionBannerControl() {
  const [banner, setBanner] = useState<QuestionBanner | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [speed, setSpeed] = useState(50)

  useEffect(() => {
    loadBanner()

    const channel = supabase
      .channel('question_banners_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'question_banners'
      }, () => {
        loadBanner()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadBanner = async () => {
    const { data } = await supabase
      .from('question_banners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setBanner(data as QuestionBanner)
      setQuestionText(data.question_text)
      setSpeed(data.animation_speed)
    }
  }

  const updateBannerText = async () => {
    if (!banner) return

    await supabase
      .from('question_banners')
      .update({ 
        question_text: questionText,
        updated_at: new Date().toISOString()
      })
      .eq('id', banner.id)
  }

  const updateSpeed = async (newSpeed: number) => {
    if (!banner) return

    setSpeed(newSpeed)
    await supabase
      .from('question_banners')
      .update({ 
        animation_speed: newSpeed,
        updated_at: new Date().toISOString()
      })
      .eq('id', banner.id)
  }

  const toggleVisibility = async () => {
    if (!banner) return

    await supabase
      .from('question_banners')
      .update({ 
        is_visible: !banner.is_visible,
        updated_at: new Date().toISOString()
      })
      .eq('id', banner.id)
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <MessageSquare className="w-7 h-7 text-yellow-400" />
        Question Banner
      </h2>

      {/* Text Input */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2">
          Banner Text
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onBlur={updateBannerText}
            className="flex-1 bg-gray-900 border-2 border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="Enter your question or topic..."
          />
        </div>
      </div>

      {/* Speed Slider */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Animation Speed: {speed}%
        </label>
        <input
          type="range"
          min="10"
          max="200"
          value={speed}
          onChange={(e) => updateSpeed(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #EAB308 0%, #EAB308 ${(speed - 10) / 1.9}%, #374151 ${(speed - 10) / 1.9}%, #374151 100%)`
          }}
        />
      </div>

      {/* Preview */}
      <div className="mb-4 bg-gray-900 border-2 border-gray-700 rounded-lg p-4 overflow-hidden">
        <p className="text-xs text-gray-400 mb-2 font-semibold">PREVIEW:</p>
        <div className="bg-red-600 text-white px-4 py-3 rounded overflow-hidden">
          <div 
            className="whitespace-nowrap animate-scroll"
            style={{
              animation: `scroll ${100 / speed * 20}s linear infinite`
            }}
          >
            {questionText || 'Enter text above to preview...'}
          </div>
        </div>
      </div>

      {/* Show/Hide Toggle */}
      <button
        onClick={toggleVisibility}
        className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${
          banner?.is_visible
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/50'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          {banner?.is_visible ? (
            <>
              <Pause className="w-6 h-6" />
              HIDE BANNER
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              SHOW BANNER
            </>
          )}
        </div>
      </button>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
