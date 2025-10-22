/**
 * MIDI Controller Support
 * Map MIDI hardware controllers to DJ software controls
 * Support for buttons, faders, knobs, and jog wheels
 */

export type MIDIControlType = 'button' | 'fader' | 'knob' | 'jogwheel';

export type MIDIAction =
  | 'play'
  | 'pause'
  | 'cue'
  | 'sync'
  | 'volume'
  | 'crossfader'
  | 'eq-low'
  | 'eq-mid'
  | 'eq-high'
  | 'filter'
  | 'fx'
  | 'hotcue'
  | 'loop'
  | 'beatjump'
  | 'scratch'
  | 'pitch'
  | 'custom';

export interface MIDIMapping {
  id: string;
  deviceName: string;
  channel: number; // MIDI channel (0-15)
  note: number; // MIDI note/CC number (0-127)
  controlType: MIDIControlType;
  action: MIDIAction;
  actionParams?: any; // Additional parameters for action
  min?: number; // Minimum value for mapping
  max?: number; // Maximum value for mapping
}

export class MIDIControllerManager {
  private midiAccess: MIDIAccess | null = null;
  private mappings: Map<string, MIDIMapping> = new Map();
  private listeners: Map<string, (value: number) => void> = new Map();
  private learningMode: boolean = false;
  private learningCallback: ((mapping: Partial<MIDIMapping>) => void) | null = null;

  /**
   * Initialize MIDI access
   */
  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.setupInputListeners();
      return true;
    } catch (error) {
      console.error('Failed to access MIDI devices:', error);
      return false;
    }
  }

  /**
   * Setup listeners for all MIDI inputs
   */
  private setupInputListeners(): void {
    if (!this.midiAccess) return;

    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = this.handleMIDIMessage.bind(this);
    }
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    const [status, note, velocity] = event.data;
    const channel = status & 0x0f;
    const messageType = status & 0xf0;

    // Learning mode - capture MIDI input for mapping
    if (this.learningMode && this.learningCallback) {
      const deviceName = event.target ? (event.target as MIDIInput).name || 'Unknown' : 'Unknown';

      this.learningCallback({
        deviceName,
        channel,
        note,
        controlType: this.detectControlType(messageType, velocity),
      });
      return;
    }

    // Normal mode - execute mapped actions
    const mappingKey = this.getMappingKey(channel, note);
    const mapping = this.mappings.get(mappingKey);

    if (mapping) {
      const normalizedValue = velocity / 127; // Normalize to 0-1
      const listener = this.listeners.get(mapping.id);

      if (listener) {
        listener(normalizedValue);
      }
    }
  }

  /**
   * Detect control type from MIDI message
   */
  private detectControlType(messageType: number, velocity: number): MIDIControlType {
    // Note On/Off (buttons)
    if (messageType === 0x90 || messageType === 0x80) {
      return velocity > 0 ? 'button' : 'button';
    }
    // Control Change (knobs/faders)
    if (messageType === 0xb0) {
      return 'fader'; // Could be knob or fader
    }
    // Pitch Bend (jog wheels)
    if (messageType === 0xe0) {
      return 'jogwheel';
    }
    return 'knob';
  }

  /**
   * Create mapping key from channel and note
   */
  private getMappingKey(channel: number, note: number): string {
    return `${channel}-${note}`;
  }

  /**
   * Add MIDI mapping
   */
  addMapping(mapping: MIDIMapping): void {
    const key = this.getMappingKey(mapping.channel, mapping.note);
    this.mappings.set(key, mapping);
  }

  /**
   * Remove MIDI mapping
   */
  removeMapping(mappingId: string): void {
    for (const [key, mapping] of this.mappings.entries()) {
      if (mapping.id === mappingId) {
        this.mappings.delete(key);
        this.listeners.delete(mappingId);
        break;
      }
    }
  }

  /**
   * Register action listener for mapping
   */
  onAction(mappingId: string, callback: (value: number) => void): void {
    this.listeners.set(mappingId, callback);
  }

  /**
   * Start MIDI learn mode
   */
  startLearn(callback: (mapping: Partial<MIDIMapping>) => void): void {
    this.learningMode = true;
    this.learningCallback = callback;
  }

  /**
   * Stop MIDI learn mode
   */
  stopLearn(): void {
    this.learningMode = false;
    this.learningCallback = null;
  }

  /**
   * Get all connected MIDI devices
   */
  getDevices(): MIDIInput[] {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values());
  }

  /**
   * Get all mappings
   */
  getMappings(): MIDIMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Export mappings to JSON
   */
  exportMappings(): string {
    const mappingsArray = Array.from(this.mappings.values());
    return JSON.stringify(mappingsArray, null, 2);
  }

  /**
   * Import mappings from JSON
   */
  importMappings(json: string): boolean {
    try {
      const mappingsArray: MIDIMapping[] = JSON.parse(json);
      this.mappings.clear();

      for (const mapping of mappingsArray) {
        this.addMapping(mapping);
      }

      return true;
    } catch (error) {
      console.error('Failed to import MIDI mappings:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.mappings.clear();
    this.listeners.clear();
    this.learningMode = false;
    this.learningCallback = null;
  }
}

/**
 * Create MIDI controller manager
 */
export async function createMIDIController(): Promise<MIDIControllerManager | null> {
  const manager = new MIDIControllerManager();
  const success = await manager.initialize();
  return success ? manager : null;
}

/**
 * Default MIDI mappings for popular controllers
 */
export const DEFAULT_MIDI_MAPPINGS: Record<string, MIDIMapping[]> = {
  'Pioneer DDJ-400': [
    {
      id: 'play-deck-a',
      deviceName: 'Pioneer DDJ-400',
      channel: 0,
      note: 11,
      controlType: 'button',
      action: 'play',
    },
    {
      id: 'cue-deck-a',
      deviceName: 'Pioneer DDJ-400',
      channel: 0,
      note: 12,
      controlType: 'button',
      action: 'cue',
    },
    {
      id: 'crossfader',
      deviceName: 'Pioneer DDJ-400',
      channel: 0,
      note: 8,
      controlType: 'fader',
      action: 'crossfader',
    },
  ],
  'Numark Mixtrack': [
    {
      id: 'play-deck-a',
      deviceName: 'Numark Mixtrack',
      channel: 0,
      note: 42,
      controlType: 'button',
      action: 'play',
    },
  ],
};
