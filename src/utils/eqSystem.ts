/**
 * EQ System - Equalizer management for DJ decks
 */

export interface EQBand {
  frequency: number;
  gain: number;
  q: number;
}

export interface EQPreset {
  id: string;
  name: string;
  bands: EQBand[];
}

export class EQSystem {
  private bands: EQBand[] = [];
  private isEnabled: boolean = false;

  constructor() {
    this.initializeDefaultBands();
  }

  private initializeDefaultBands(): void {
    this.bands = [
      { frequency: 60, gain: 0, q: 1.0 },
      { frequency: 170, gain: 0, q: 1.0 },
      { frequency: 310, gain: 0, q: 1.0 },
      { frequency: 600, gain: 0, q: 1.0 },
      { frequency: 1000, gain: 0, q: 1.0 },
      { frequency: 3000, gain: 0, q: 1.0 },
      { frequency: 6000, gain: 0, q: 1.0 },
      { frequency: 12000, gain: 0, q: 1.0 },
      { frequency: 14000, gain: 0, q: 1.0 },
      { frequency: 16000, gain: 0, q: 1.0 },
    ];
  }

  setBandGain(frequency: number, gain: number): void {
    const band = this.bands.find(b => b.frequency === frequency);
    if (band) {
      band.gain = Math.max(-12, Math.min(12, gain));
    }
  }

  getBandGain(frequency: number): number {
    const band = this.bands.find(b => b.frequency === frequency);
    return band ? band.gain : 0;
  }

  reset(): void {
    this.bands.forEach(band => {
      band.gain = 0;
    });
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  isEQEnabled(): boolean {
    return this.isEnabled;
  }

  getBands(): EQBand[] {
    return [...this.bands];
  }

  loadPreset(preset: EQPreset): void {
    this.bands = [...preset.bands];
  }

  savePreset(name: string): EQPreset {
    return {
      id: `eq-${Date.now()}`,
      name,
      bands: [...this.bands],
    };
  }

  dispose(): void {}
}

export class ThreeBandEQ extends EQSystem {
  constructor() {
    super();
    // Initialize with 3-band EQ specific settings
  }
  
  connect(_target?: any) { return this; }
  disconnect() {}
  getOutput() { 
    // Return a mock audio node that has connect method
    return {
      connect: (target: any) => target,
      disconnect: () => {}
    };
  }
}

export default EQSystem;
