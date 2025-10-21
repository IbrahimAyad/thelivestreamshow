import { useState, useEffect, useCallback, useRef } from 'react';
import { SoundEffectsEngine, SoundEffect } from '@/utils/studio/soundEffectsEngine';

export interface KeyboardShortcut {
  key: string;
  effect: SoundEffect;
  label: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: '1', effect: 'airHorn', label: 'Air Horn' },
  { key: '2', effect: 'siren', label: 'Siren' },
  { key: '3', effect: 'rewind', label: 'Rewind' },
  { key: '4', effect: 'laserZap', label: 'Laser Zap' },
  { key: '5', effect: 'riser', label: 'Riser' },
  { key: '6', effect: 'impact', label: 'Impact' },
  { key: '7', effect: 'vinyl', label: 'Vinyl Scratch' },
  { key: '8', effect: 'whiteNoise', label: 'White Noise' },
];

export function useSoundEffects() {
  const engineRef = useRef<SoundEffectsEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [lastPlayedEffect, setLastPlayedEffect] = useState<SoundEffect | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Lazy initialization - create engine but don't initialize AudioContext
  const ensureEngine = useCallback(() => {
    if (!engineRef.current) {
      console.log('🎵 Creating SoundEffectsEngine (lazy initialization)');
      engineRef.current = new SoundEffectsEngine();
      setIsReady(true);
    }
    return engineRef.current;
  }, []);

  // Update engine volume when state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
  }, [volume]);

  // Play a sound effect (async to support lazy initialization)
  const playEffect = useCallback(async (effect: SoundEffect, duration?: number) => {
    try {
      const engine = ensureEngine();
      await engine.play(effect, duration);
      setLastPlayedEffect(effect);
      setIsPlaying(true);

      // Reset playing state after a short delay
      setTimeout(() => setIsPlaying(false), 500);
    } catch (error) {
      console.error('Failed to play sound effect:', error);
    }
  }, [ensureEngine]);

  // Stop current effect
  const stopEffect = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsPlaying(false);
    }
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if the pressed key matches any shortcut
      const shortcut = shortcuts.find(s => s.key === event.key);
      if (shortcut) {
        event.preventDefault();
        playEffect(shortcut.effect);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyboardEnabled, shortcuts, playEffect]);

  // Customize a keyboard shortcut
  const setShortcut = useCallback((key: string, effect: SoundEffect, label: string) => {
    setShortcuts(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) {
        return prev.map(s => s.key === key ? { key, effect, label } : s);
      }
      return [...prev, { key, effect, label }];
    });
  }, []);

  // Reset shortcuts to defaults
  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
  }, []);

  return {
    // State
    isReady,
    volume,
    keyboardEnabled,
    shortcuts,
    lastPlayedEffect,
    isPlaying,

    // Actions
    playEffect,
    stopEffect,
    setVolume,
    setKeyboardEnabled,
    setShortcut,
    resetShortcuts,
  };
}
