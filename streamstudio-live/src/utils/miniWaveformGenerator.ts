/**
 * Mini Waveform Generator for Sampler Pads
 * Generates small waveform visualizations for sample previews
 */

export interface MiniWaveformOptions {
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: Required<MiniWaveformOptions> = {
  width: 80,
  height: 30,
  barCount: 40,
  barColor: '#ffffff',
  backgroundColor: 'transparent',
};

/**
 * Generate mini waveform as base64 data URL
 */
export function generateMiniWaveform(
  audioBuffer: AudioBuffer,
  options: MiniWaveformOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear background
  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, opts.width, opts.height);

  // Get audio data
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerBar = Math.floor(channelData.length / opts.barCount);
  const barWidth = opts.width / opts.barCount;
  const centerY = opts.height / 2;

  // Draw bars
  ctx.fillStyle = opts.barColor;
  for (let i = 0; i < opts.barCount; i++) {
    const start = i * samplesPerBar;
    const end = start + samplesPerBar;
    let max = 0;

    // Find max amplitude in this segment
    for (let j = start; j < end && j < channelData.length; j++) {
      max = Math.max(max, Math.abs(channelData[j]));
    }

    const barHeight = max * (opts.height / 2) * 0.9;
    const x = i * barWidth;

    // Draw centered bar
    ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
  }

  // Return as data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generate mini waveform and cache it
 */
export class MiniWaveformCache {
  private cache: Map<string, string> = new Map();

  generate(audioBuffer: AudioBuffer, color: string, key: string): string {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const dataUrl = generateMiniWaveform(audioBuffer, {
      barColor: color,
      width: 100,
      height: 30,
    });

    this.cache.set(key, dataUrl);
    return dataUrl;
  }

  clear(key: string): void {
    this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
  }
}
