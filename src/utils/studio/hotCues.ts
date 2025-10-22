/**
 * Hot Cues System
 * Manages 8 cue points per deck with persistence
 * Uses IndexedDB for local storage
 */

export interface HotCue {
  id: number; // 0-7 for 8 cues
  time: number; // Position in seconds
  label?: string;
  color: string;
}

export interface CuePoint {
  trackId: string;
  cues: HotCue[];
  lastModified: number;
}

const DB_NAME = 'DJCuePoints';
const DB_VERSION = 1;
const STORE_NAME = 'cuePoints';

// Default colors for 8 hot cues
const DEFAULT_CUE_COLORS = [
  '#ff0080', // Pink
  '#00d4ff', // Cyan
  '#ffaa00', // Orange
  '#00ff88', // Green
  '#aa00ff', // Purple
  '#ffff00', // Yellow
  '#ff4444', // Red
  '#4488ff', // Blue
];

// Export as EXTENDED_CUE_COLORS for backwards compatibility
export const EXTENDED_CUE_COLORS = DEFAULT_CUE_COLORS;

// Preset cue labels
export const PRESET_CUE_LABELS = [
  'Intro',
  'Verse',
  'Chorus',
  'Drop',
  'Break',
  'Build',
  'Outro',
  'Custom',
];

/**
 * Initialize IndexedDB for cue points
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
      }
    };
  });
}

/**
 * Load cue points for a track
 */
export async function loadCuePoints(trackId: string): Promise<HotCue[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(trackId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result: CuePoint | undefined = request.result;
        resolve(result?.cues || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load cue points:', error);
    return [];
  }
}

/**
 * Save cue points for a track
 */
export async function saveCuePoints(trackId: string, cues: HotCue[]): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cuePoint: CuePoint = {
      trackId,
      cues,
      lastModified: Date.now(),
    };

    const request = store.put(cuePoint);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save cue points:', error);
  }
}

/**
 * Set a hot cue at current time
 */
export async function setHotCue(
  trackId: string,
  cueId: number,
  time: number,
  label?: string
): Promise<HotCue[]> {
  const cues = await loadCuePoints(trackId);
  const existingIndex = cues.findIndex((c) => c.id === cueId);

  const newCue: HotCue = {
    id: cueId,
    time,
    label: label || `Cue ${cueId + 1}`,
    color: DEFAULT_CUE_COLORS[cueId],
  };

  if (existingIndex >= 0) {
    cues[existingIndex] = newCue;
  } else {
    cues.push(newCue);
  }

  cues.sort((a, b) => a.id - b.id);
  await saveCuePoints(trackId, cues);
  return cues;
}

/**
 * Delete a hot cue
 */
export async function deleteHotCue(trackId: string, cueId: number): Promise<HotCue[]> {
  const cues = await loadCuePoints(trackId);
  const filtered = cues.filter((c) => c.id !== cueId);
  await saveCuePoints(trackId, filtered);
  return filtered;
}

/**
 * Clear all cues for a track
 */
export async function clearAllCues(trackId: string): Promise<void> {
  await saveCuePoints(trackId, []);
}

/**
 * Get keyboard shortcut for cue (1-8)
 */
export function getCueKeyboardShortcut(cueId: number): string {
  return `${cueId + 1}`;
}

/**
 * Get cue ID from keyboard event
 */
export function getCueIdFromKey(key: string): number | null {
  const num = parseInt(key, 10);
  if (num >= 1 && num <= 8) {
    return num - 1; // Convert to 0-7
  }
  return null;
}
