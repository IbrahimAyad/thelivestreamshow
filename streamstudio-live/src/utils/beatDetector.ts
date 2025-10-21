/**
 * Beat Detection Algorithm
 * Based on Joe Sullivan's approach (78% accuracy for electronic music)
 * Uses OfflineAudioContext + BiquadFilterNode for kick drum isolation
 * Then applies peak detection algorithm
 */

export interface BeatGrid {
  bpm: number;
  beats: number[]; // Array of beat timestamps in seconds
  confidence: number; // 0-1 score
  firstBeatOffset: number; // Time of first detected beat
}

export interface BeatDetectionOptions {
  minBPM?: number;
  maxBPM?: number;
  sensitivity?: number; // 0-1, how sensitive to peaks
}

const DEFAULT_OPTIONS: Required<BeatDetectionOptions> = {
  minBPM: 60,
  maxBPM: 200,
  sensitivity: 0.5,
};

/**
 * Detect beats in an audio buffer using kick drum isolation
 */
export async function detectBeats(
  audioBuffer: AudioBuffer,
  options: BeatDetectionOptions = {}
): Promise<BeatGrid> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Step 1: Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    1, // mono
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  // Step 2: Create source and low-pass filter (150Hz for kick drums)
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  const lowpass = offlineContext.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 150; // Isolate kick drum frequencies
  lowpass.Q.value = 1;

  // Connect: source -> lowpass -> destination
  source.connect(lowpass);
  lowpass.connect(offlineContext.destination);

  // Step 3: Start rendering
  source.start();
  const filteredBuffer = await offlineContext.startRendering();

  // Step 4: Apply peak detection
  const peaks = findPeaks(filteredBuffer, opts);

  // Step 5: Calculate BPM from peaks
  const bpm = calculateBPM(peaks, filteredBuffer.sampleRate, opts);

  // Step 6: Quantize peaks to beat grid
  const beatGrid = quantizeBeats(peaks, bpm, filteredBuffer.sampleRate);

  return {
    bpm,
    beats: beatGrid,
    confidence: calculateConfidence(peaks, beatGrid, filteredBuffer.sampleRate),
    firstBeatOffset: beatGrid[0] || 0,
  };
}

/**
 * Find peaks in audio data (potential beat locations)
 */
function findPeaks(
  buffer: AudioBuffer,
  options: Required<BeatDetectionOptions>
): number[] {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const peaks: number[] = [];

  // Calculate energy envelope (RMS over windows)
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const hopSize = Math.floor(windowSize / 4);
  const envelope: number[] = [];

  for (let i = 0; i < data.length - windowSize; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += data[i + j] ** 2;
    }
    envelope.push(Math.sqrt(sum / windowSize));
  }

  // Find threshold (adaptive based on sensitivity)
  const sortedEnvelope = [...envelope].sort((a, b) => b - a);
  const threshold = sortedEnvelope[Math.floor(sortedEnvelope.length * (1 - options.sensitivity))];

  // Detect peaks above threshold with minimum spacing
  const minPeakDistance = Math.floor((60 / options.maxBPM) * (sampleRate / hopSize));
  let lastPeakIndex = -minPeakDistance;

  for (let i = 1; i < envelope.length - 1; i++) {
    // Check if this is a local maximum
    if (
      envelope[i] > envelope[i - 1] &&
      envelope[i] > envelope[i + 1] &&
      envelope[i] > threshold &&
      i - lastPeakIndex >= minPeakDistance
    ) {
      peaks.push(i * hopSize);
      lastPeakIndex = i;
    }
  }

  return peaks;
}

/**
 * Calculate BPM from detected peaks using interval histogram
 */
function calculateBPM(
  peaks: number[],
  sampleRate: number,
  options: Required<BeatDetectionOptions>
): number {
  if (peaks.length < 2) return 120; // Default fallback

  // Calculate intervals between consecutive peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const interval = (peaks[i] - peaks[i - 1]) / sampleRate;
    const bpm = 60 / interval;

    // Only consider intervals in valid BPM range
    if (bpm >= options.minBPM && bpm <= options.maxBPM) {
      intervals.push(interval);
    }
  }

  if (intervals.length === 0) return 120;

  // Create histogram of intervals (rounded to nearest 0.01s)
  const histogram = new Map<number, number>();
  intervals.forEach((interval) => {
    const rounded = Math.round(interval * 100) / 100;
    histogram.set(rounded, (histogram.get(rounded) || 0) + 1);
  });

  // Find most common interval
  let maxCount = 0;
  let mostCommonInterval = 0;
  histogram.forEach((count, interval) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonInterval = interval;
    }
  });

  const bpm = 60 / mostCommonInterval;
  return Math.round(bpm * 10) / 10; // Round to 1 decimal place
}

/**
 * Quantize detected peaks to a regular beat grid
 */
function quantizeBeats(peaks: number[], bpm: number, sampleRate: number): number[] {
  if (peaks.length === 0) return [];

  const beatInterval = (60 / bpm) * sampleRate; // Samples per beat
  const beatGrid: number[] = [];

  // Find first beat (align to first strong peak)
  const firstBeat = peaks[0];

  // Generate quantized beat grid
  const duration = peaks[peaks.length - 1];
  for (let sample = firstBeat; sample < duration; sample += beatInterval) {
    beatGrid.push(sample / sampleRate); // Convert to seconds
  }

  return beatGrid;
}

/**
 * Calculate confidence score for beat detection
 */
function calculateConfidence(
  peaks: number[],
  beatGrid: number[],
  sampleRate: number
): number {
  if (peaks.length === 0 || beatGrid.length === 0) return 0;

  // Count how many detected peaks align with beat grid (within tolerance)
  const tolerance = sampleRate * 0.05; // 50ms tolerance
  let matches = 0;

  peaks.forEach((peak) => {
    const nearestBeat = beatGrid.reduce((prev, curr) => {
      const prevDist = Math.abs(prev * sampleRate - peak);
      const currDist = Math.abs(curr * sampleRate - peak);
      return currDist < prevDist ? curr : prev;
    });

    if (Math.abs(nearestBeat * sampleRate - peak) < tolerance) {
      matches++;
    }
  });

  return matches / peaks.length;
}

/**
 * Snap a time position to the nearest beat
 */
export function snapToBeat(time: number, beatGrid: BeatGrid): number {
  if (beatGrid.beats.length === 0) return time;

  return beatGrid.beats.reduce((prev, curr) =>
    Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
  );
}

/**
 * Calculate number of beats between two time positions
 */
export function countBeats(startTime: number, endTime: number, bpm: number): number {
  const beatDuration = 60 / bpm;
  return Math.round((endTime - startTime) / beatDuration);
}

/**
 * Get beat position at a specific time
 */
export function getBeatAtTime(time: number, beatGrid: BeatGrid): number {
  for (let i = 0; i < beatGrid.beats.length; i++) {
    if (beatGrid.beats[i] > time) {
      return i - 1;
    }
  }
  return beatGrid.beats.length - 1;
}
