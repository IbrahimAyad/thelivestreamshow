/**
 * Generate simple audio effects using Web Audio API
 */
export class AudioGenerator {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Generate applause sound effect
   */
  generateApplause(duration: number = 2): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Create noise with envelope
        const envelope = Math.sin((i / length) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
      }
    }

    return buffer;
  }

  /**
   * Generate laughter sound effect
   */
  generateLaughter(duration: number = 1.5): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Burst pattern for laughter
        const burstPattern = Math.sin(i / 800) * Math.sin(i / 1200);
        const noise = Math.random() * 2 - 1;
        const envelope = Math.exp(-i / (sampleRate * 0.8));
        data[i] = noise * burstPattern * envelope * 0.2;
      }
    }

    return buffer;
  }

  /**
   * Generate cheer sound effect
   */
  generateCheer(duration: number = 1.5): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Higher frequency noise for cheers
        const highFreq = Math.sin(i / 100) * 0.5;
        const noise = Math.random() * 2 - 1;
        const envelope = 1 - (i / length);
        data[i] = (noise + highFreq) * envelope * 0.25;
      }
    }

    return buffer;
  }

  /**
   * Generate gasps sound effect
   */
  generateGasps(duration: number = 1): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Sharp attack, quick decay
        const envelope = Math.exp(-i / (sampleRate * 0.2));
        const lowFreq = Math.sin(i / 50);
        data[i] = lowFreq * envelope * 0.3;
      }
    }

    return buffer;
  }

  /**
   * Generate agreement sound ("Mmm-hmm")
   */
  generateAgreement(duration: number = 0.5): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Two-tone pattern
        const tone1 = Math.sin(2 * Math.PI * 200 * i / sampleRate);
        const tone2 = Math.sin(2 * Math.PI * 250 * i / sampleRate);
        const envelope = Math.sin((i / length) * Math.PI);
        const blend = i < length / 2 ? tone1 : tone2;
        data[i] = blend * envelope * 0.2;
      }
    }

    return buffer;
  }

  /**
   * Generate thinking sound ("Hmm...")
   */
  generateThinking(duration: number = 0.8): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const freq = 150 + (i / length) * 50; // Rising pitch
        const tone = Math.sin(2 * Math.PI * freq * i / sampleRate);
        const envelope = Math.exp(-i / (sampleRate * 0.5));
        data[i] = tone * envelope * 0.15;
      }
    }

    return buffer;
  }

  /**
   * Play an audio buffer
   */
  playBuffer(buffer: AudioBuffer, volume: number = 1) {
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(0);
  }
}

// Cache for generated audio buffers
const audioCache = new Map<string, AudioBuffer>();
let audioGenerator: AudioGenerator | null = null;

export async function playSoundEffect(effectName: string) {
  if (!audioGenerator) {
    audioGenerator = new AudioGenerator();
  }

  // Check cache first
  if (audioCache.has(effectName)) {
    audioGenerator.playBuffer(audioCache.get(effectName)!, 0.7);
    return;
  }

  // Generate and cache the sound
  let buffer: AudioBuffer;
  switch (effectName.toLowerCase()) {
    case 'applause':
      buffer = audioGenerator.generateApplause();
      break;
    case 'laughter':
      buffer = audioGenerator.generateLaughter();
      break;
    case 'cheers':
      buffer = audioGenerator.generateCheer();
      break;
    case 'gasps':
      buffer = audioGenerator.generateGasps();
      break;
    case 'agreement':
      buffer = audioGenerator.generateAgreement();
      break;
    case 'thinking':
      buffer = audioGenerator.generateThinking();
      break;
    default:
      console.warn(`Unknown sound effect: ${effectName}`);
      return;
  }

  audioCache.set(effectName, buffer);
  audioGenerator.playBuffer(buffer, 0.7);
}

/**
 * Text-to-Speech using Web Speech API as fallback
 */
export function speakText(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 0.8;
  utterance.volume = options.volume ?? 1;
  
  // Try to use a robotic-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || v.name.includes('Chrome') || v.name.includes('Male')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}