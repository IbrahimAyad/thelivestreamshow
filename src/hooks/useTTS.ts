import { useState, useEffect, useCallback, useRef } from 'react';

export interface TTSSettings {
  pitch: number;
  rate: number;
  volume: number;
  voiceIndex: number;
}

export interface UseTTS {
  speak: (text: string, onStateChange?: (state: 'speaking' | 'idle') => void) => void;
  stop: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  settings: TTSSettings;
  updateSettings: (newSettings: Partial<TTSSettings>) => void;
}

export function useTTS(): UseTTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);
  const [settings, setSettings] = useState<TTSSettings>({
    pitch: 1,
    rate: 1,
    volume: 0.9,
    voiceIndex: 0
  });

  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const onStateChangeRef = useRef<((state: 'speaking' | 'idle') => void) | undefined>();

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synthRef.current.getVoices();
      console.log('📢 TTS: Loaded voices:', availableVoices.length);
      
      if (availableVoices.length === 0) {
        console.warn('⚠️ No voices loaded yet');
        return;
      }

      console.log('Available voices:', availableVoices.map(v => `${v.name} (${v.lang})`));
      setVoices(availableVoices);
      
      // Check for saved voice preference
      const savedVoiceName = localStorage.getItem('betabot_preferred_voice');
      if (savedVoiceName) {
        const savedVoice = availableVoices.find(v => v.name === savedVoiceName);
        if (savedVoice) {
          setSelectedVoiceState(savedVoice);
          console.log('✅ Loaded saved voice preference:', savedVoiceName);
          return;
        }
      }
      
      // Priority order for voice selection
      const preferredVoiceNames = [
        // Microsoft voices (Windows)
        'Microsoft David',
        'Microsoft Zira',
        'Microsoft Mark',
        'Microsoft Aria',
        
        // Google voices (Chrome)
        'Google US English',
        'Google UK English Female',
        'Google UK English Male',
        
        // Apple voices (macOS/iOS)
        'Samantha',
        'Alex',
        'Karen',
        'Daniel'
      ];
      
      // Try to find a preferred voice
      let bestVoice = null;
      
      for (const preferredName of preferredVoiceNames) {
        bestVoice = availableVoices.find(v => 
          v.name.includes(preferredName) && v.lang.startsWith('en')
        );
        if (bestVoice) {
          console.log('✅ Selected preferred voice:', bestVoice.name);
          break;
        }
      }
      
      // Fallback logic if no preferred voice found
      if (!bestVoice) {
        // Try Microsoft
        bestVoice = availableVoices.find(v => 
          v.name.toLowerCase().includes('microsoft') && v.lang.startsWith('en')
        );
      }
      
      if (!bestVoice) {
        // Try Google
        bestVoice = availableVoices.find(v => 
          v.name.toLowerCase().includes('google') && v.lang.startsWith('en')
        );
      }
      
      if (!bestVoice) {
        // Try any English voice
        bestVoice = availableVoices.find(v => v.lang.startsWith('en'));
      }
      
      if (!bestVoice) {
        // Last resort: first available voice
        bestVoice = availableVoices[0];
      }
      
      setSelectedVoiceState(bestVoice);
      console.log('🎤 Final selected voice:', bestVoice?.name, '(', bestVoice?.lang, ')');
    };

    // Load voices immediately
    loadVoices();
    
    // Voices might load asynchronously, so set up listener
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    // Try again after delays in case voices load slowly
    const timeout1 = setTimeout(loadVoices, 100);
    const timeout2 = setTimeout(loadVoices, 500);

    return () => {
      synthRef.current.onvoiceschanged = null;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  const speak = useCallback((text: string, onStateChange?: (state: 'speaking' | 'idle') => void) => {
    console.log('🎙️ TTS speak() called with text:', text.substring(0, 50) + '...');
    console.log('🔍 DEBUG: Current selectedVoice in speak():', selectedVoice?.name || 'NONE');
    
    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      console.log('📢 TTS: Cancelling previous speech');
      synthRef.current.cancel();
    }

    if (!text || text.trim().length === 0) {
      console.warn('⚠️ TTS: Empty text provided, skipping');
      return;
    }

    onStateChangeRef.current = onStateChange;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice - CRITICAL: Must set the actual voice object
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('✅ TTS: APPLIED VOICE to utterance:', selectedVoice.name, '(', selectedVoice.lang, ')');
      console.log('🔍 DEBUG: Utterance.voice after assignment:', utterance.voice?.name);
    } else {
      console.warn('⚠️ TTS: No voice selected, browser will use system default');
    }

    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;

    utterance.onstart = () => {
      console.log('✅ TTS: Started speaking with voice:', utterance.voice?.name || 'default');
      setIsSpeaking(true);
      onStateChangeRef.current?.('speaking');
    };

    utterance.onend = () => {
      console.log('✅ TTS: Finished speaking');
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
    };

    utterance.onerror = (event) => {
      console.error('❌ TTS error:', event.error, event);
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
    };

    console.log('📢 TTS: Calling speechSynthesis.speak() with voice:', utterance.voice?.name || 'default');
    console.log('📢 TTS Settings:', { 
      voice: utterance.voice?.name,
      pitch: utterance.pitch, 
      rate: utterance.rate, 
      volume: utterance.volume 
    });
    
    try {
      synthRef.current.speak(utterance);
      console.log('✅ TTS: speak() command issued successfully');
    } catch (error) {
      console.error('❌ TTS: Exception when calling speak():', error);
    }
  }, [selectedVoice, settings]);

  const stop = useCallback(() => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      onStateChangeRef.current?.('idle');
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Persist voice selection to localStorage
  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
    console.log('🔄 VOICE CHANGE: User selected:', voice.name, '(', voice.lang, ')');
    setSelectedVoiceState(voice);
    localStorage.setItem('betabot_preferred_voice', voice.name);
    console.log('💾 Saved voice preference to localStorage:', voice.name);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    settings,
    updateSettings
  };
}
