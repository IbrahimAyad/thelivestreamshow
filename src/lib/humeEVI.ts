/**
 * Hume AI EVI (Empathic Voice Interface) Integration
 *
 * Real-time emotion detection via WebSocket streaming
 * wss://api.hume.ai/v0/evi/chat
 */

export interface HumeEVIConfig {
  apiKey: string;
  configId?: string; // Optional EVI configuration ID
  verboseTranscription?: boolean;
  resumedChatGroupId?: string; // Resume previous conversation
}

export interface EmotionScore {
  name: string;
  score: number;
}

export interface UserMessage {
  type: 'user_message';
  message: {
    role: 'user';
    content: string;
  };
  models: {
    prosody?: {
      scores: EmotionScore[];
    };
  };
  from_text: boolean;
}

export interface AssistantMessage {
  type: 'assistant_message';
  message: {
    role: 'assistant';
    content: string;
  };
  models: {
    prosody?: {
      scores: EmotionScore[];
    };
  };
}

export interface AudioOutput {
  type: 'audio_output';
  data: string; // base64 encoded audio
}

export interface AssistantEnd {
  type: 'assistant_end';
}

export interface AudioInput {
  type: 'audio_input';
  data: string; // base64 encoded audio
}

export interface SessionSettings {
  type: 'session_settings';
  audio: {
    encoding: 'linear16' | 'webm';
    channels: number;
    sample_rate: number;
  };
}

export type HumeEVIMessage =
  | UserMessage
  | AssistantMessage
  | AudioOutput
  | AssistantEnd;

export interface HumeEVICallbacks {
  onUserMessage?: (msg: UserMessage) => void;
  onAssistantMessage?: (msg: AssistantMessage) => void;
  onAudioOutput?: (audio: string) => void; // base64
  onEmotionDetected?: (emotions: EmotionScore[]) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Hume EVI WebSocket Client
 */
export class HumeEVIClient {
  private ws: WebSocket | null = null;
  private config: HumeEVIConfig;
  private callbacks: HumeEVICallbacks;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;

  constructor(config: HumeEVIConfig, callbacks: HumeEVICallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Connect to Hume EVI WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build WebSocket URL with query parameters
      const params = new URLSearchParams();
      params.append('api_key', this.config.apiKey);

      if (this.config.configId) {
        params.append('config_id', this.config.configId);
      }

      if (this.config.verboseTranscription !== undefined) {
        params.append('verbose_transcription', String(this.config.verboseTranscription));
      }

      if (this.config.resumedChatGroupId) {
        params.append('resumed_chat_group_id', this.config.resumedChatGroupId);
      }

      const wsUrl = `wss://api.hume.ai/v0/evi/chat?${params.toString()}`;

      console.log('🎭 Connecting to Hume EVI...');

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Hume EVI connected');

        // Send session settings for audio encoding
        this.sendSessionSettings();

        this.callbacks.onOpen?.();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (event) => {
        const error = new Error('Hume EVI WebSocket error');
        console.error('❌ Hume EVI error:', error);
        this.callbacks.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Hume EVI disconnected');
        this.callbacks.onClose?.();
        this.ws = null;
      };
    });
  }

  /**
   * Send session settings for audio encoding
   */
  private sendSessionSettings() {
    const settings: SessionSettings = {
      type: 'session_settings',
      audio: {
        encoding: 'linear16',
        channels: 1,
        sample_rate: 44100 // CD quality
      }
    };

    this.send(settings);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string) {
    try {
      const message: HumeEVIMessage = JSON.parse(data);

      switch (message.type) {
        case 'user_message':
          console.log('👤 User message:', message.message.content);

          // Extract emotion scores from prosody
          if (message.models.prosody?.scores) {
            this.callbacks.onEmotionDetected?.(message.models.prosody.scores);
          }

          this.callbacks.onUserMessage?.(message);
          break;

        case 'assistant_message':
          console.log('🤖 Assistant message:', message.message.content);
          this.callbacks.onAssistantMessage?.(message);
          break;

        case 'audio_output':
          console.log('🔊 Audio output received');
          this.audioQueue.push(message.data);
          this.callbacks.onAudioOutput?.(message.data);

          // Auto-play audio queue
          if (!this.isPlaying) {
            this.playNextAudio();
          }
          break;

        case 'assistant_end':
          console.log('✅ Assistant finished speaking');
          break;

        default:
          console.log('📨 Unknown message type:', message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Send audio chunk to Hume EVI
   */
  sendAudio(audioData: ArrayBuffer | Blob): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert to base64
        const base64Audio = await this.arrayBufferToBase64(audioData);

        const audioMessage: AudioInput = {
          type: 'audio_input',
          data: base64Audio
        };

        this.send(audioMessage);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Play audio queue
   */
  private async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const base64Audio = this.audioQueue.shift()!;

    try {
      // Convert base64 to blob
      const audioBlob = this.base64ToBlob(base64Audio, 'audio/wav');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.playNextAudio(); // Play next in queue
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        this.playNextAudio(); // Try next
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNextAudio(); // Try next
    }
  }

  /**
   * Stop audio playback and clear queue
   */
  stopAudio() {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Send message to WebSocket
   */
  private send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Convert ArrayBuffer or Blob to base64
   */
  private arrayBufferToBase64(data: ArrayBuffer | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        resolve(btoa(binary));
      } else {
        // Blob
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(data);
      }
    });
  }

  /**
   * Convert base64 to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Disconnect from Hume EVI
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopAudio();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Helper: Capture audio from microphone and stream to Hume EVI
 */
export class AudioStreamCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private eviClient: HumeEVIClient;
  private chunkInterval: number = 100; // Send chunks every 100ms

  constructor(eviClient: HumeEVIClient) {
    this.eviClient = eviClient;
  }

  /**
   * Start capturing audio from microphone
   */
  async start(deviceId?: string): Promise<void> {
    try {
      const constraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      };

      if (deviceId) {
        constraints.deviceId = { exact: deviceId };
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: constraints
      });

      // Use linear16 PCM format
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=pcm',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // Send audio chunks as they become available
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.eviClient.isConnected()) {
          await this.eviClient.sendAudio(event.data);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
      };

      // Start recording and request chunks at interval
      this.mediaRecorder.start(this.chunkInterval);
      console.log('🎤 Audio capture started');

    } catch (error) {
      console.error('Failed to start audio capture:', error);
      throw error;
    }
  }

  /**
   * Stop capturing audio
   */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    console.log('🎤 Audio capture stopped');
  }

  /**
   * Check if currently capturing
   */
  isCapturing(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
