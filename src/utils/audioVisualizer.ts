/**
 * Audio Visualizer - Handles audio visualization rendering
 */

export interface VisualizerConfig {
  barCount: number;
  smoothing: number;
  colorScheme: 'default' | 'rainbow' | 'monochrome';
  sensitivity: number;
}

export interface AudioData {
  frequencies: number[];
  waveform: number[];
  volume: number;
  peak: number;
  timestamp?: number;
}

export interface FrequencyData {
  frequencies: number[];
  timestamp: number;
  low?: number;
  mid?: number;
  high?: number;
  average?: number; // Average frequency value
}

export class AudioVisualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: VisualizerConfig;
  private animationId: number | null = null;

  constructor(config: Partial<VisualizerConfig> = {}) {
    this.config = {
      barCount: 64,
      smoothing: 0.8,
      colorScheme: 'default',
      sensitivity: 1.0,
      ...config,
    };
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(audioData: AudioData): void {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.canvas;
    const barWidth = width / this.config.barCount;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw bars
    audioData.frequencies.slice(0, this.config.barCount).forEach((value, i) => {
      const barHeight = (value / 255) * height * this.config.sensitivity;
      const x = i * barWidth;
      const y = height - barHeight;

      if (this.ctx) {
        this.ctx.fillStyle = this.getBarColor(i, value);
        this.ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    });
  }

  private getBarColor(index: number, value: number): string {
    const intensity = value / 255;
    
    switch (this.config.colorScheme) {
      case 'rainbow':
        const hue = (index / this.config.barCount) * 360;
        return `hsl(${hue}, 100%, ${50 + intensity * 50}%)`;
      
      case 'monochrome':
        const lightness = 30 + intensity * 70;
        return `hsl(0, 0%, ${lightness}%)`;
      
      default:
        return `rgba(0, 255, 0, ${0.5 + intensity * 0.5})`;
    }
  }

  start(getAudioData: () => AudioData): void {
    const animate = () => {
      const data = getAudioData();
      this.render(data);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
  }
}

// Additional visualization functions
export function drawSpectrumBars(
  ctx: CanvasRenderingContext2D,
  data: AudioData,
  config: VisualizerConfig
): void {
  // Implementation for spectrum bars
}

export function drawCircularWaveform(
  ctx: CanvasRenderingContext2D,
  data: AudioData,
  config: VisualizerConfig
): void {
  // Implementation for circular waveform
}

export function drawVinylDisc(
  ctx: CanvasRenderingContext2D,
  data: AudioData,
  config: VisualizerConfig
): void {
  // Implementation for vinyl disc visualization
}

export function getFrequencyBands(data: AudioData): number[] {
  return data.frequencies;
}

export function getEnergyColor(energy: number): string {
  const hue = (energy * 120) % 360; // Green to red
  return `hsl(${hue}, 100%, 50%)`;
}

export function getEnergyGradient(energy: number): CanvasGradient | null {
  return null; // Would create gradient
}

export function getAverageVolume(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const sum = dataArray.reduce((a, b) => a + b, 0);
  return sum / dataArray.length / 255; // Normalize to 0-1
}

export function getFrequencyData(analyser: AnalyserNode): number[] {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  return Array.from(dataArray).map(val => val / 255); // Normalize to 0-1
}

export class ParticleSystem {
  constructor() {}
  update(data: AudioData): void {}
  render(ctx: CanvasRenderingContext2D): void {}
  emit(x: number, y: number): void {}
  draw(ctx: CanvasRenderingContext2D): void {} // Additional draw method
}

export default AudioVisualizer;

