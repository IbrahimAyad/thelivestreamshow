/**
 * Preset Manager - Manages scene presets for automation
 */

export type PresetCategory = 'intro' | 'segment' | 'transition' | 'outro' | 'custom' | 'interview' | 'discussion' | 'presentation' | 'qa' | 'break' | 'technical';

export interface PresetFilter {
  category?: PresetCategory;
  tags?: string[];
  searchQuery?: string;
  search?: string; // Alias for searchQuery
  favorites_only?: boolean;
}

export interface PresetAction {
  type: 'scene' | 'source' | 'graphic' | 'audio';
  data: Record<string, any>;
  delay?: number; // milliseconds
  action_type?: string; // Alias for type
  params?: Record<string, any>; // Alias for data
  delay_ms?: number; // Alias for delay
}

export interface ScenePreset {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  actions: PresetAction[];
  thumbnail?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  is_public?: boolean;
  automation_config?: any;
  trigger_rules?: any[];
  action_sequence?: any[];
  is_favorite?: boolean;
  use_count?: number;
  last_used_at?: Date | string;
}

export class PresetManager {
  private presets: Map<string, ScenePreset> = new Map();

  constructor() {
    // Initialize with default presets
    this.loadDefaultPresets();
  }

  private loadDefaultPresets(): void {
    // Add some default presets
    const defaults: ScenePreset[] = [
      {
        id: 'intro-default',
        name: 'Default Intro',
        category: 'intro',
        actions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaults.forEach(preset => {
      this.presets.set(preset.id, preset);
    });
  }

  async getPreset(id: string): Promise<ScenePreset | null> {
    return this.presets.get(id) || null;
  }

  async getPresetById(id: string): Promise<ScenePreset | null> {
    return this.getPreset(id);
  }

  async getAllPresets(): Promise<ScenePreset[]> {
    return Array.from(this.presets.values());
  }

  async getPresetsByCategory(category: PresetCategory): Promise<ScenePreset[]> {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  async createPreset(preset: Omit<ScenePreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScenePreset> {
    const newPreset: ScenePreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.presets.set(newPreset.id, newPreset);
    return newPreset;
  }

  async updatePreset(id: string, updates: Partial<ScenePreset>): Promise<ScenePreset | null> {
    const preset = this.presets.get(id);
    if (!preset) return null;

    const updated = {
      ...preset,
      ...updates,
      updatedAt: new Date(),
    };
    this.presets.set(id, updated);
    return updated;
  }

  async deletePreset(id: string): Promise<boolean> {
    return this.presets.delete(id);
  }

  async executePreset(id: string): Promise<void> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset ${id} not found`);
    }

    // Execute each action in sequence
    for (const action of preset.actions) {
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }
      // Action execution would go here
      console.log('[PresetManager] Executing action:', action);
    }
  }

  subscribe(callback: () => void): () => void {
    // Simple subscription - just return unsubscribe function
    return () => {};
  }

  async loadPresets(): Promise<void> {
    // Load presets from storage
    console.log('[PresetManager] Loading presets');
  }

  filterPresets(filter: PresetFilter): ScenePreset[] {
    let filtered = Array.from(this.presets.values());
    
    if (filter.category) {
      filtered = filtered.filter(p => p.category === filter.category);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(p => 
        p.tags?.some(tag => filter.tags?.includes(tag))
      );
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  async applyPreset(id: string): Promise<void> {
    return this.executePreset(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    // Toggle favorite status (would need to add favorite field)
    console.log('[PresetManager] Toggling favorite:', id);
  }

  async duplicatePreset(id: string): Promise<ScenePreset | null> {
    const preset = this.presets.get(id);
    if (!preset) return null;

    return this.createPreset({
      ...preset,
      name: `${preset.name} (Copy)`,
    });
  }

  async exportPreset(id: string): Promise<string> {
    const preset = this.presets.get(id);
    if (!preset) throw new Error(`Preset ${id} not found`);
    
    return JSON.stringify(preset, null, 2);
  }

  async importPreset(data: string): Promise<ScenePreset> {
    const parsed = JSON.parse(data);
    const newPreset = await this.createPreset({
      ...parsed,
      name: parsed.name || 'Imported Preset',
    });
    return newPreset;
  }
}

