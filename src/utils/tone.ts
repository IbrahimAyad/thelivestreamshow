/**
 * Tone.js placeholder - Audio synthesis library
 * This is a minimal implementation for TypeScript compatibility
 */

export interface ToneOptions {
  frequency?: number;
  volume?: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

export class Tone {
  private frequency: number = 440;
  private volume: number = 0;
  private isPlaying: boolean = false;

  constructor(options?: ToneOptions) {
    if (options) {
      this.frequency = options.frequency || 440;
      this.volume = options.volume || 0;
    }
  }

  start(): void {
    this.isPlaying = true;
    console.log(`[Tone] Starting tone at ${this.frequency}Hz`);
  }

  stop(): void {
    this.isPlaying = false;
    console.log('[Tone] Stopping tone');
  }

  setFrequency(freq: number): void {
    this.frequency = freq;
  }

  setVolume(vol: number): void {
    this.volume = vol;
  }

  getFrequency(): number {
    return this.frequency;
  }

  getVolume(): number {
    return this.volume;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export class Oscillator extends Tone {
  private type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine';

  constructor(type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', options?: ToneOptions) {
    super(options);
    this.type = type;
  }

  getType(): string {
    return this.type;
  }

  setType(type: 'sine' | 'square' | 'sawtooth' | 'triangle'): void {
    this.type = type;
  }
}

export class Transport {
  private bpm: number = 120;
  private isPlaying: boolean = false;

  start(): void {
    this.isPlaying = true;
    console.log(`[Transport] Starting at ${this.bpm} BPM`);
  }

  stop(): void {
    this.isPlaying = false;
    console.log('[Transport] Stopping');
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  getBpm(): number {
    return this.bpm;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const transport = new Transport();

// Additional globals to match used API in VoiceRecorder
export const Destination = {} as any;
export function start() {/* no-op */}
export function getContext() { return {} as any; }

export class Player {
  private isPlaying: boolean = false;
  onstop?: () => void;
  constructor(..._args: any[]) {}
  connect(_target?: any) { return this; }
  
  start(): void {
    this.isPlaying = true;
    console.log('[Player] Starting playback');
  }
  
  stop(): void {
    this.isPlaying = false;
    console.log('[Player] Stopping playback');
    if (this.onstop) this.onstop();
  }
  
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
  dispose() {}
}

export class PitchShift {
  public pitch: number = 0;
  private _chain: any[] = [];
  connect(_target?: any) { return this; }
  dispose() {}
  
  constructor(pitch: number = 0) {
    this.pitch = pitch;
  }
  
  setPitch(pitch: number): void {
    this.pitch = pitch;
  }
  
  getPitch(): number {
    return this.pitch;
  }
  
  chain(...args: any[]) {
    this._chain = args;
    return this;
  }
}

export class Reverb {
  private roomSize: number = 0.5;
  private dampening: number = 0.5;
  public wet: { value: number } = { value: 0.5 };
  
  constructor(roomSize: number | { decay?: number; wet?: number } = 0.5, dampening: number = 0.5) {
    if (typeof roomSize === 'number') {
      this.roomSize = roomSize;
      this.dampening = dampening;
    } else {
      this.roomSize = 0.5;
      this.dampening = 0.5;
      this.wet.value = roomSize.wet ?? 0.5;
    }
  }
  
  setRoomSize(size: number): void {
    this.roomSize = size;
  }
  
  setDampening(d: number): void {
    this.dampening = d;
  }
  generate() {}
  connect(_target?: any) { return this; }
  dispose() {}
}

export class Distortion {
  public distortion: number = 0;
  
  constructor(distortion: number = 0) {
    this.distortion = distortion;
  }
  
  setDistortion(distortion: number): void {
    this.distortion = distortion;
  }
  
  getDistortion(): number {
    return this.distortion;
  }
  connect(_target?: any) { return this; }
  dispose() {}
}

export default {
  Tone,
  Oscillator,
  Transport,
  Destination,
  start,
  getContext,
  Player,
  PitchShift,
  Reverb,
  Distortion,
  transport,
};
