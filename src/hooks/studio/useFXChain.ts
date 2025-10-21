import { useState, useEffect, useRef } from 'react'
import { 
  ProfessionalFXChain, 
  FXChainConfig, 
  FXPreset, 
  FX_PRESETS,
  DelayEffect,
  ReverbEffect,
  FlangerEffect,
  PhaserEffect,
  BitCrusherEffect
} from '@/utils/studio/fxChain'

export function useFXChain(audioContext: AudioContext | null) {
  const fxChainRef = useRef<ProfessionalFXChain | null>(null)
  const [config, setConfig] = useState<FXChainConfig>({
    delay: { time: 0.25, feedback: 0.3, wet: 0, enabled: false },
    reverb: { size: 'medium', wet: 0, enabled: false },
    flanger: { rate: 0.5, depth: 0.5, wet: 0, enabled: false },
    phaser: { rate: 0.5, stages: 4, wet: 0, enabled: false },
    bitCrusher: { bits: 16, sampleRate: 44100, wet: 0, enabled: false },
  })
  const [currentPreset, setCurrentPreset] = useState<string>('Clean')

  // Initialize FX chain when audio context is available
  useEffect(() => {
    if (!audioContext) return

    if (!fxChainRef.current) {
      fxChainRef.current = new ProfessionalFXChain(audioContext)
    }

    return () => {
      if (fxChainRef.current) {
        fxChainRef.current.disconnect()
      }
    }
  }, [audioContext])

  const setDelay = (delayConfig: Partial<DelayEffect>) => {
    if (!fxChainRef.current) return
    fxChainRef.current.setDelay(delayConfig)
    setConfig(prev => ({
      ...prev,
      delay: { ...prev.delay, ...delayConfig }
    }))
    setCurrentPreset('Custom')
  }

  const setReverb = (reverbConfig: Partial<ReverbEffect>) => {
    if (!fxChainRef.current) return
    fxChainRef.current.setReverb(reverbConfig)
    setConfig(prev => ({
      ...prev,
      reverb: { ...prev.reverb, ...reverbConfig }
    }))
    setCurrentPreset('Custom')
  }

  const setFlanger = (flangerConfig: Partial<FlangerEffect>) => {
    if (!fxChainRef.current) return
    fxChainRef.current.setFlanger(flangerConfig)
    setConfig(prev => ({
      ...prev,
      flanger: { ...prev.flanger, ...flangerConfig }
    }))
    setCurrentPreset('Custom')
  }

  const setPhaser = (phaserConfig: Partial<PhaserEffect>) => {
    if (!fxChainRef.current) return
    fxChainRef.current.setPhaser(phaserConfig)
    setConfig(prev => ({
      ...prev,
      phaser: { ...prev.phaser, ...phaserConfig }
    }))
    setCurrentPreset('Custom')
  }

  const setBitCrusher = (crusherConfig: Partial<BitCrusherEffect>) => {
    if (!fxChainRef.current) return
    fxChainRef.current.setBitCrusher(crusherConfig)
    setConfig(prev => ({
      ...prev,
      bitCrusher: { ...prev.bitCrusher, ...crusherConfig }
    }))
    setCurrentPreset('Custom')
  }

  const applyPreset = (preset: FXPreset) => {
    if (!fxChainRef.current) return
    
    // Reset all to default first
    const cleanPreset = FX_PRESETS.find(p => p.name === 'Clean')
    if (cleanPreset) {
      fxChainRef.current.applyPreset(cleanPreset)
    }
    
    // Apply selected preset
    fxChainRef.current.applyPreset(preset)
    setConfig(fxChainRef.current.getConfig())
    setCurrentPreset(preset.name)
  }

  const connectFXChain = (source: AudioNode, destination: AudioNode) => {
    if (!fxChainRef.current) return
    fxChainRef.current.connect(source, destination)
  }

  return {
    config,
    currentPreset,
    presets: FX_PRESETS,
    fxChain: fxChainRef.current,
    setDelay,
    setReverb,
    setFlanger,
    setPhaser,
    setBitCrusher,
    applyPreset,
    connectFXChain,
  }
}
