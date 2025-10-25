/**
 * Data normalization utilities to transform database schema to frontend-expected formats
 */

export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SceneSource {
  id: string;
  source_type: string;
  content?: any;
  position?: Position;
  size?: Size;
  z_index: number;
  styles?: Record<string, any>;
}

/**
 * Normalizes scene sources from database format to frontend format
 * Database stores position_x, position_y as flat properties (in pixels)
 * Frontend expects position: { x, y } nested object (in percentages)
 */
export function normalizeSceneSources(sources: any[]): SceneSource[] {
  if (!sources || !Array.isArray(sources)) {
    return [];
  }

  return sources.map(source => {
    // If source already has position object, return as is (already normalized)
    if (source.position && typeof source.position === 'object') {
      return {
        id: source.id,
        source_type: source.source_type || source.type,
        content: source.content,
        position: source.position,
        size: source.size,
        z_index: source.z_index ?? 0,
        styles: source.styles,
      };
    }

    const normalized: SceneSource = {
      id: source.id,
      source_type: source.source_type || source.type,
      content: source.content,
      z_index: source.z_index ?? 0,
      styles: source.styles,
    };

    // Convert flat position properties (pixels) to nested object (percentages)
    // Assumes 1920x1080 base resolution
    if (typeof source.position_x === 'number' && typeof source.position_y === 'number') {
      normalized.position = {
        x: (source.position_x / 1920) * 100,
        y: (source.position_y / 1080) * 100,
      };
    }

    // Convert flat size properties (pixels) to nested object (percentages)
    if (typeof source.width === 'number' && typeof source.height === 'number') {
      if (!normalized.position) {
        normalized.position = { x: 0, y: 0 };
      }
      normalized.position = {
        ...normalized.position,
        width: (source.width / 1920) * 100,
        height: (source.height / 1080) * 100,
      };
    }

    return normalized;
  });
}
