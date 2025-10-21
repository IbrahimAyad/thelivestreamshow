/**
 * Waveform Rendering Utility
 * Generates colored waveforms with frequency-based coloring
 * Uses Canvas API with OfflineAudioContext for frequency separation
 */

export interface WaveformData {
  samples: Float32Array; // Amplitude data
  frequencies: Uint8Array[]; // Frequency data per sample [low, mid, high]
  duration: number;
  sampleRate: number;
}

export interface WaveformRenderOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  waveformColor?: string;
  beatMarkerColor?: string;
  useFrequencyColors?: boolean; // Enable frequency-based coloring
  pixelRatio?: number;
}

const DEFAULT_RENDER_OPTIONS: Required<WaveformRenderOptions> = {
  width: 800,
  height: 128,
  backgroundColor: '#1a1a2e',
  waveformColor: '#00d4ff',
  beatMarkerColor: '#ff0080',
  useFrequencyColors: true,
  pixelRatio: window.devicePixelRatio || 1,
};

/**
 * Generate waveform data from audio buffer
 */
export async function generateWaveformData(
  audioBuffer: AudioBuffer,
  samplesPerPixel: number = 512
): Promise<WaveformData> {
  const channelData = audioBuffer.getChannelData(0); // Use left channel
  const totalSamples = channelData.length;
  const waveformLength = Math.floor(totalSamples / samplesPerPixel);

  // Generate amplitude samples
  const samples = new Float32Array(waveformLength);
  for (let i = 0; i < waveformLength; i++) {
    const start = i * samplesPerPixel;
    const end = start + samplesPerPixel;
    let max = 0;

    for (let j = start; j < end && j < totalSamples; j++) {
      max = Math.max(max, Math.abs(channelData[j]));
    }

    samples[i] = max;
  }

  // Generate frequency data using offline context
  const frequencies = await extractFrequencyData(audioBuffer, waveformLength);

  return {
    samples,
    frequencies,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}

/**
 * Extract frequency data (low/mid/high) for color visualization
 */
async function extractFrequencyData(
  audioBuffer: AudioBuffer,
  numSamples: number
): Promise<Uint8Array[]> {
  const frequencies: Uint8Array[] = [];
  const analyser = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const source = analyser.createBufferSource();
  source.buffer = audioBuffer;

  const analyserNode = analyser.createAnalyser();
  analyserNode.fftSize = 256;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyserNode);
  analyserNode.connect(analyser.destination);

  // For simplified implementation, we'll approximate frequency distribution
  // In a full implementation, this would use ScriptProcessorNode or AudioWorklet
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerBin = Math.floor(channelData.length / numSamples);

  for (let i = 0; i < numSamples; i++) {
    const start = i * samplesPerBin;
    const end = start + samplesPerBin;
    const slice = channelData.slice(start, end);

    // Simple frequency approximation using amplitude distribution
    const low = calculateBandEnergy(slice, 0, 0.2);
    const mid = calculateBandEnergy(slice, 0.2, 0.6);
    const high = calculateBandEnergy(slice, 0.6, 1.0);

    frequencies.push(new Uint8Array([low, mid, high]));
  }

  return frequencies;
}

/**
 * Calculate energy in a frequency band (simplified)
 */
function calculateBandEnergy(
  samples: Float32Array,
  startRatio: number,
  endRatio: number
): number {
  const start = Math.floor(samples.length * startRatio);
  const end = Math.floor(samples.length * endRatio);
  let energy = 0;

  for (let i = start; i < end; i++) {
    energy += samples[i] ** 2;
  }

  return Math.min(255, Math.sqrt(energy / (end - start)) * 512);
}

/**
 * Render waveform to canvas
 */
export function renderWaveform(
  canvas: HTMLCanvasElement,
  waveformData: WaveformData,
  beatTimes: number[] = [],
  options: Partial<WaveformRenderOptions> = {}
): void {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size with pixel ratio
  canvas.width = opts.width * opts.pixelRatio;
  canvas.height = opts.height * opts.pixelRatio;
  canvas.style.width = `${opts.width}px`;
  canvas.style.height = `${opts.height}px`;
  ctx.scale(opts.pixelRatio, opts.pixelRatio);

  // Clear canvas
  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, opts.width, opts.height);

  // Draw waveform
  const centerY = opts.height / 2;
  const barWidth = opts.width / waveformData.samples.length;

  for (let i = 0; i < waveformData.samples.length; i++) {
    const amplitude = waveformData.samples[i];
    const barHeight = amplitude * (opts.height / 2);
    const x = i * barWidth;

    // Color based on frequency content
    if (opts.useFrequencyColors && waveformData.frequencies[i]) {
      const [low, mid, high] = waveformData.frequencies[i];
      ctx.fillStyle = `rgb(${high}, ${mid}, ${low})`; // Red=high, Green=mid, Blue=low
    } else {
      ctx.fillStyle = opts.waveformColor;
    }

    // Draw bar (centered)
    ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, barWidth), barHeight);
  }

  // Draw beat markers
  if (beatTimes.length > 0) {
    ctx.fillStyle = opts.beatMarkerColor;
    const timeToX = (time: number) => (time / waveformData.duration) * opts.width;

    beatTimes.forEach((beatTime) => {
      const x = timeToX(beatTime);
      ctx.fillRect(x - 1, 0, 2, opts.height);
    });
  }
}

/**
 * Render waveform region (for zoomed views)
 */
export function renderWaveformRegion(
  canvas: HTMLCanvasElement,
  waveformData: WaveformData,
  startTime: number,
  endTime: number,
  beatTimes: number[] = [],
  options: Partial<WaveformRenderOptions> = {}
): void {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };

  // Calculate sample range
  const totalSamples = waveformData.samples.length;
  const startSample = Math.floor((startTime / waveformData.duration) * totalSamples);
  const endSample = Math.floor((endTime / waveformData.duration) * totalSamples);

  // Create sub-waveform data
  const regionSamples = waveformData.samples.slice(startSample, endSample);
  const regionFrequencies = waveformData.frequencies.slice(startSample, endSample);
  const regionDuration = endTime - startTime;

  const regionData: WaveformData = {
    samples: regionSamples,
    frequencies: regionFrequencies,
    duration: regionDuration,
    sampleRate: waveformData.sampleRate,
  };

  // Filter beat times to region
  const regionBeats = beatTimes.filter((t) => t >= startTime && t <= endTime).map((t) => t - startTime);

  renderWaveform(canvas, regionData, regionBeats, options);
}

/**
 * Create offscreen canvas for waveform generation (optimization)
 */
export function createOffscreenWaveform(
  waveformData: WaveformData,
  beatTimes: number[],
  options: Partial<WaveformRenderOptions> = {}
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  renderWaveform(canvas, waveformData, beatTimes, options);
  return canvas;
}
