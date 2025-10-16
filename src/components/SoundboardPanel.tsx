import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Music2, Volume2 } from 'lucide-react'
import { playSoundEffect } from '../utils/audioGenerator'

interface SoundEffect {
  id: string
  effect_name: string
  effect_type: string
  volume: number
  is_playing: boolean
}

export function SoundboardPanel() {
  const [effects, setEffects] = useState<SoundEffect[]>([])
  const [masterVolume, setMasterVolume] = useState(80)
  const [playingEffectId, setPlayingEffectId] = useState<string | null>(null)

  useEffect(() => {
    loadEffects()

    const channel = supabase
      .channel('soundboard_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'soundboard_effects'
      }, () => {
        loadEffects()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadEffects = async () => {
    const { data } = await supabase
      .from('soundboard_effects')
      .select('*')
      .order('effect_name')
    
    if (data) setEffects(data as SoundEffect[])
  }

  const playEffect = async (effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    if (!effect) return;

    setPlayingEffectId(effectId);

    // Play actual sound effect locally
    const effectName = effect.effect_type.replace('_light', '').replace('_heavy', '');
    
    try {
      // Play the sound using Web Audio API
      playSoundEffect(effectName);
    } catch (error) {
      console.error('Error playing sound effect:', error);
    }

    // Set is_playing to true (triggers broadcast overlay)
    await supabase
      .from('soundboard_effects')
      .update({ is_playing: true })
      .eq('id', effectId);

    // Reset after 3 seconds
    setTimeout(async () => {
      await supabase
        .from('soundboard_effects')
        .update({ is_playing: false })
        .eq('id', effectId);
      
      setPlayingEffectId(null);
    }, 3000);
  }

  const getEffectColor = (type: string) => {
    const colors: Record<string, string> = {
      'applause_light': 'from-green-600 to-green-700',
      'applause_heavy': 'from-green-700 to-green-800',
      'laughter': 'from-yellow-600 to-yellow-700',
      'cheers': 'from-blue-600 to-blue-700',
      'ooh': 'from-purple-600 to-purple-700',
      'crickets': 'from-gray-600 to-gray-700'
    }
    return colors[type] || 'from-gray-600 to-gray-700'
  }

  return (
    <div className="bg-black border-2 border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <Music2 className="w-7 h-7 text-green-400" />
        Audience Reactions
      </h2>

      {/* Master Volume */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Master Volume: {masterVolume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #10B981 0%, #10B981 ${masterVolume}%, #374151 ${masterVolume}%, #374151 100%)`
          }}
        />
      </div>

      {/* Sound Effect Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {effects.map((effect) => (
          <button
            key={effect.id}
            onClick={() => playEffect(effect.id)}
            className={`relative h-24 rounded-lg bg-gradient-to-br ${getEffectColor(effect.effect_type)} hover:brightness-110 text-white font-bold text-lg transition-all ${
              effect.is_playing || playingEffectId === effect.id 
                ? 'ring-4 ring-white animate-pulse scale-105 shadow-lg shadow-white/50' 
                : ''
            }`}
            title={`Play ${effect.effect_name} (F${effects.indexOf(effect) + 1})`}
          >
            {effect.effect_name}
            {(effect.is_playing || playingEffectId === effect.id) && (
              <>
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                <span className="block text-xs mt-1 text-white/90 font-semibold">PLAYING</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
        <p className="font-semibold">Late-Night Show Style</p>
        <p className="text-xs mt-1">Prominent, impactful audience reactions for professional production</p>
      </div>
    </div>
  )
}
