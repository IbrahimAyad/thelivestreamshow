/**
 * FX Chain - Effects chain management for DJ decks
 */

export interface FXEffect {
  id: string;
  type: 'filter' | 'delay' | 'reverb' | 'distortion' | 'chorus' | 'flanger';
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface FXChain {
  id: string;
  name: string;
  effects: FXEffect[];
  isActive: boolean;
}

export class FXChainManager {
  private chains: Map<string, FXChain> = new Map();
  private activeChain: string | null = null;

  constructor() {
    this.initializeDefaultChains();
  }

  private initializeDefaultChains(): void {
    const defaultChains: FXChain[] = [
      {
        id: 'default',
        name: 'Default',
        effects: [],
        isActive: false,
      },
      {
        id: 'dubstep',
        name: 'Dubstep',
        effects: [
          {
            id: 'filter-1',
            type: 'filter',
            enabled: true,
            parameters: { cutoff: 0.5, resonance: 0.7 },
          },
          {
            id: 'distortion-1',
            type: 'distortion',
            enabled: true,
            parameters: { drive: 0.3, tone: 0.5 },
          },
        ],
        isActive: false,
      },
    ];

    defaultChains.forEach(chain => {
      this.chains.set(chain.id, chain);
    });
  }

  addEffect(chainId: string, effect: FXEffect): void {
    const chain = this.chains.get(chainId);
    if (chain) {
      chain.effects.push(effect);
    }
  }

  removeEffect(chainId: string, effectId: string): void {
    const chain = this.chains.get(chainId);
    if (chain) {
      chain.effects = chain.effects.filter(e => e.id !== effectId);
    }
  }

  updateEffect(chainId: string, effectId: string, updates: Partial<FXEffect>): void {
    const chain = this.chains.get(chainId);
    if (chain) {
      const effect = chain.effects.find(e => e.id === effectId);
      if (effect) {
        Object.assign(effect, updates);
      }
    }
  }

  activateChain(chainId: string): void {
    // Deactivate current chain
    if (this.activeChain) {
      const currentChain = this.chains.get(this.activeChain);
      if (currentChain) {
        currentChain.isActive = false;
      }
    }

    // Activate new chain
    const chain = this.chains.get(chainId);
    if (chain) {
      chain.isActive = true;
      this.activeChain = chainId;
    }
  }

  deactivateChain(): void {
    if (this.activeChain) {
      const chain = this.chains.get(this.activeChain);
      if (chain) {
        chain.isActive = false;
      }
      this.activeChain = null;
    }
  }

  getActiveChain(): FXChain | null {
    return this.activeChain ? this.chains.get(this.activeChain) || null : null;
  }

  getAllChains(): FXChain[] {
    return Array.from(this.chains.values());
  }

  createChain(name: string): FXChain {
    const chain: FXChain = {
      id: `fx-${Date.now()}`,
      name,
      effects: [],
      isActive: false,
    };
    this.chains.set(chain.id, chain);
    return chain;
  }

  deleteChain(chainId: string): boolean {
    if (this.activeChain === chainId) {
      this.deactivateChain();
    }
    return this.chains.delete(chainId);
  }
}

export class ProfessionalFXChain extends FXChainManager {
  constructor() {
    super();
    // Initialize with professional FX chain settings
  }
  
  connect(_target?: any, _target2?: any) { return this; }
  disconnect() {}
}

export default FXChainManager;
