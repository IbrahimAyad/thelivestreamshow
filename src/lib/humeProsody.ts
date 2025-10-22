/**
 * Hume AI Prosody API (Expression Measurement)
 *
 * Just emotion detection from audio - no conversational AI
 * Much cheaper than EVI: ~$0.005/minute vs $0.015/minute
 */

export interface EmotionScore {
  name: string;
  score: number;
}

export interface ProsodyResult {
  emotions: EmotionScore[];
  file: {
    duration_ms: number;
  };
}

export interface HumeProsodyConfig {
  apiKey: string;
  secretKey: string;
}

/**
 * Analyze audio file for emotions using Hume Prosody API
 */
export async function analyzeAudioProsody(
  audioBlob: Blob,
  config: HumeProsodyConfig
): Promise<ProsodyResult | null> {
  try {
    console.log('🎭 Analyzing audio with Hume Prosody API...');

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('models', JSON.stringify({
      prosody: {}
    }));

    // Use batch jobs API for prosody analysis
    const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': config.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hume API error:', errorText);
      throw new Error(`Hume API error: ${response.statusText}`);
    }

    const jobData = await response.json();
    const jobId = jobData.job_id;

    console.log('📊 Job created:', jobId, '- Waiting for results...');

    // Poll for results
    const result = await pollForResults(jobId, config.apiKey);

    if (!result) {
      throw new Error('No results from Hume API');
    }

    return result;

  } catch (error) {
    console.error('❌ Hume Prosody error:', error);
    return null;
  }
}

/**
 * Poll for job results (batch API is async)
 */
async function pollForResults(
  jobId: string,
  apiKey: string,
  maxAttempts: number = 10
): Promise<ProsodyResult | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const response = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
      headers: {
        'X-Hume-Api-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Error checking job status:', response.statusText);
      continue;
    }

    const data = await response.json();
    const status = data.state?.status;

    console.log(`📊 Job status: ${status}`);

    if (status === 'COMPLETED') {
      // Get predictions
      const predictions = data.state?.predictions?.[0]?.results?.predictions?.[0];
      const prosodyPredictions = predictions?.models?.prosody?.grouped_predictions?.[0]?.predictions;

      if (!prosodyPredictions || prosodyPredictions.length === 0) {
        return null;
      }

      // Get the most recent frame's emotions
      const latestFrame = prosodyPredictions[prosodyPredictions.length - 1];
      const emotions = latestFrame.emotions || [];

      return {
        emotions: emotions.map((e: any) => ({
          name: e.name,
          score: e.score
        })),
        file: {
          duration_ms: data.state?.predictions?.[0]?.file?.duration_ms || 0
        }
      };
    }

    if (status === 'FAILED') {
      throw new Error('Hume job failed');
    }

    // Continue polling
  }

  throw new Error('Hume job timeout');
}

/**
 * Streaming prosody analysis (more expensive but real-time)
 * Use for live audio streams
 */
export class HumeProsodyStream {
  private ws: WebSocket | null = null;
  private config: HumeProsodyConfig;
  private onEmotions?: (emotions: EmotionScore[]) => void;

  constructor(
    config: HumeProsodyConfig,
    callbacks: {
      onEmotions?: (emotions: EmotionScore[]) => void;
      onError?: (error: Error) => void;
    }
  ) {
    this.config = config;
    this.onEmotions = callbacks.onEmotions;
  }

  /**
   * Connect to streaming API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://api.hume.ai/v0/stream/models?apikey=${this.config.apiKey}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Hume Prosody Stream connected');

        // Send configuration
        this.ws?.send(JSON.stringify({
          models: {
            prosody: {}
          }
        }));

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.prosody?.predictions) {
            const emotions = data.prosody.predictions[0]?.emotions || [];
            this.onEmotions?.(emotions);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Hume Prosody Stream disconnected');
        this.ws = null;
      };
    });
  }

  /**
   * Send audio data for analysis
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // Convert to base64
    const bytes = new Uint8Array(audioData);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const base64 = btoa(binary);

    this.ws.send(JSON.stringify({
      data: base64,
      models: {
        prosody: {}
      }
    }));
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
