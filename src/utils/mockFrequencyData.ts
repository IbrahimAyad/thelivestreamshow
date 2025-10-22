/**
 * Mock Frequency Data - Generates mock audio frequency data for testing
 */

export interface FrequencyData {
  frequencies: number[];
  timestamp: number;
}

export function generateMockFrequencyData(size: number = 64): FrequencyData {
  const frequencies = new Array(size).fill(0).map(() => {
    return Math.random() * 255;
  });

  return {
    frequencies,
    timestamp: Date.now(),
  };
}

export function generateAnimatedFrequencyData(
  size: number = 64,
  baseIntensity: number = 0.5,
  time: number = Date.now()
): FrequencyData {
  const frequencies = new Array(size).fill(0).map((_, i) => {
    const frequency = i / size;
    const wave = Math.sin(time * 0.001 + frequency * Math.PI * 2) * 0.5 + 0.5;
    const randomness = Math.random() * 0.3;
    const value = (wave * 0.7 + randomness * 0.3) * baseIntensity * 255;
    return Math.min(255, Math.max(0, value));
  });

  return {
    frequencies,
    timestamp: time,
  };
}

export function extractFrequencyBands(data: FrequencyData): { low: number; mid: number; high: number } {
  const frequencies = data.frequencies;
  const low = frequencies.slice(0, Math.floor(frequencies.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(frequencies.length / 3);
  const mid = frequencies.slice(Math.floor(frequencies.length / 3), Math.floor(frequencies.length * 2 / 3)).reduce((a, b) => a + b, 0) / Math.floor(frequencies.length / 3);
  const high = frequencies.slice(Math.floor(frequencies.length * 2 / 3)).reduce((a, b) => a + b, 0) / Math.ceil(frequencies.length / 3);
  
  return { low, mid, high };
}

export default { generateMockFrequencyData, generateAnimatedFrequencyData, extractFrequencyBands };

