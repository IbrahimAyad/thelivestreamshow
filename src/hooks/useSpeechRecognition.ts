import { useState, useEffect, useRef, useCallback } from 'react';

export interface WakeDetectionEvent {
  phrase: string;
  context: string;
  timestamp: number;
}

export interface VisualSearchEvent {
  query: string;
  context: string;
  timestamp: number;
}

export interface UseSpeechRecognitionOptions {
  onWakePhraseDetected?: (event: WakeDetectionEvent) => void;
  onVisualSearchDetected?: (event: VisualSearchEvent) => void;
  wakePhrases?: string[];
  visualSearchTriggers?: string[];
}

export interface UseSpeechRecognition {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  conversationBuffer: string;
  clearBuffer: () => void;
  error: string | null;
  transcriptionMode: 'whisper' | 'browser' | 'idle';
  whisperAvailable: boolean;
}

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const BUFFER_DURATION = 120000; // 2 minutes in milliseconds

// Default wake phrases and visual search triggers
const DEFAULT_WAKE_PHRASES = [
  'beta bot',
  'hey beta bot',
  'hey beta',
  'beta',
];

const DEFAULT_VISUAL_TRIGGERS = [
  'show me',
  'find',
  'search for',
  'look up',
  'display',
];

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognition {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversationBuffer, setConversationBuffer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [transcriptionMode, setTranscriptionMode] = useState<'whisper' | 'browser' | 'idle'>('idle');
  const [whisperAvailable, setWhisperAvailable] = useState(true);

  const wakePhrases = options.wakePhrases || DEFAULT_WAKE_PHRASES;
  const visualSearchTriggers = options.visualSearchTriggers || DEFAULT_VISUAL_TRIGGERS;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bufferTimestampsRef = useRef<Array<{ text: string; timestamp: number }>>([]);
  const browserRecognitionRef = useRef<any>(null);
  const whisperFailureCountRef = useRef(0);
  const MAX_WHISPER_FAILURES = 3;
  const currentMimeTypeRef = useRef<string>('audio/webm');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const shouldContinueRecordingRef = useRef<boolean>(false);

  // Detect wake phrases in transcript
  const detectWakePhrase = useCallback((text: string): WakeDetectionEvent | null => {
    const lowerText = text.toLowerCase();
    
    for (const phrase of wakePhrases) {
      const index = lowerText.indexOf(phrase.toLowerCase());
      if (index !== -1) {
        // Extract context (text after the wake phrase)
        const contextStart = index + phrase.length;
        const context = text.substring(contextStart).trim();
        
        return {
          phrase,
          context,
          timestamp: Date.now()
        };
      }
    }
    return null;
  }, [wakePhrases]);

  // Detect visual search commands
  const detectVisualSearch = useCallback((text: string): VisualSearchEvent | null => {
    const lowerText = text.toLowerCase();
    
    for (const trigger of visualSearchTriggers) {
      const index = lowerText.indexOf(trigger.toLowerCase());
      if (index !== -1) {
        // Extract the search query (text after the trigger)
        const queryStart = index + trigger.length;
        const query = text.substring(queryStart).trim();
        
        // Only trigger if there's a meaningful query (at least 3 chars)
        if (query.length >= 3) {
          return {
            query,
            context: text,
            timestamp: Date.now()
          };
        }
      }
    }
    return null;
  }, [visualSearchTriggers]);

  const transcribeWithWhisper = useCallback(async (audioBlob: Blob): Promise<string> => {
    console.log('🔊 transcribeWithWhisper() called');
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log('🔊 API key present:', !!apiKey, 'Length:', apiKey?.length);

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Determine file extension based on MIME type
    const mimeType = currentMimeTypeRef.current || audioBlob.type;
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('mpeg')) extension = 'mpeg';
    else if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('webm')) extension = 'webm';

    console.log('🔊 Audio details:', {
      size: audioBlob.size,
      type: audioBlob.type,
      mimeType: mimeType,
      extension: extension
    });

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    try {
      console.log('📡 Calling Whisper API:', WHISPER_API_URL);
      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      console.log('📡 Whisper API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Transcription failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
          console.error('❌ Whisper API error data:', errorData);
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error('❌ Whisper API error response:', errorText);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Whisper API success, transcribed text length:', data.text?.length);
      // Reset failure count on success
      whisperFailureCountRef.current = 0;
      return data.text || '';
    } catch (err) {
      console.error('❌ Whisper API error:', err);
      console.error('❌ Audio blob details:', {
        type: audioBlob.type,
        size: audioBlob.size,
        mimeType: mimeType,
        extension: extension
      });
      console.error('❌ Failure count:', whisperFailureCountRef.current + 1);
      whisperFailureCountRef.current++;
      throw err;
    }
  }, []);

  // Process transcript and check for triggers
  const processTranscript = useCallback((text: string) => {
    if (!text.trim()) return;

    setTranscript(text);
    
    // Add to conversation buffer with timestamp
    const now = Date.now();
    bufferTimestampsRef.current.push({
      text,
      timestamp: now
    });

    // Clean old entries from buffer (older than 2 minutes)
    bufferTimestampsRef.current = bufferTimestampsRef.current.filter(
      entry => now - entry.timestamp < BUFFER_DURATION
    );

    // Update conversation buffer
    const bufferText = bufferTimestampsRef.current
      .map(entry => entry.text)
      .join(' ');
    setConversationBuffer(bufferText);

    // Check for wake phrase detection
    const wakeEvent = detectWakePhrase(text);
    if (wakeEvent && options.onWakePhraseDetected) {
      console.log('Wake phrase detected:', wakeEvent);
      options.onWakePhraseDetected(wakeEvent);
    }

    // Check for visual search commands
    const visualSearchEvent = detectVisualSearch(text);
    if (visualSearchEvent && options.onVisualSearchDetected) {
      console.log('Visual search command detected:', visualSearchEvent);
      options.onVisualSearchDetected(visualSearchEvent);
    }
  }, [detectWakePhrase, detectVisualSearch, options]);

  const processAudioChunk = useCallback(async () => {
    console.log('🔄 processAudioChunk() called');
    console.log('🔄 Audio chunks in buffer:', audioChunksRef.current.length);

    if (audioChunksRef.current.length === 0) {
      console.warn('⚠️ No audio chunks to process');
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    console.log('🔄 Created audio blob:', audioBlob.size, 'bytes');

    // Check if audio blob is large enough (minimum 1KB = 1024 bytes)
    // Small blobs (< 1KB) are usually silence or corrupted data
    if (audioBlob.size < 1024) {
      console.warn('⚠️ Audio blob too small (likely silence):', audioBlob.size, 'bytes - skipping transcription');
      audioChunksRef.current = [];
      return;
    }

    audioChunksRef.current = [];

    try {
      console.log('📡 Sending to Whisper API...');
      const transcribedText = await transcribeWithWhisper(audioBlob);
      console.log('✅ Whisper transcription received:', transcribedText);
      processTranscript(transcribedText);
    } catch (err) {
      console.error('❌ Failed to transcribe audio chunk:', err);
      setError(err instanceof Error ? err.message : 'Transcription failed');

      // If Whisper fails too many times, switch to browser fallback
      if (whisperFailureCountRef.current >= MAX_WHISPER_FAILURES) {
        console.warn('⚠️ Whisper API failed multiple times, switching to browser fallback');
        setWhisperAvailable(false);
        stopListening();
        // Auto-restart with browser mode
        setTimeout(() => startListeningBrowser(), 1000);
      }
    }
  }, [transcribeWithWhisper, processTranscript]);

  // Browser Web Speech API fallback
  const startListeningBrowser = useCallback(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Browser speech recognition not supported');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        processTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.error('Browser speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        // Auto-restart if we're still supposed to be listening
        if (isListening && browserRecognitionRef.current) {
          recognition.start();
        }
      };

      recognition.start();
      browserRecognitionRef.current = recognition;
      setIsListening(true);
      setTranscriptionMode('browser');
      setError(null);
      console.log('Started browser speech recognition (fallback mode)');

    } catch (err) {
      console.error('Failed to start browser speech recognition:', err);
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
      setIsListening(false);
    }
  }, [processTranscript, isListening]);

  // Helper to create and configure a MediaRecorder
  const createMediaRecorder = useCallback((stream: MediaStream, onStopHandler: () => Promise<void>) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: currentMimeTypeRef.current
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('📼 Audio data received:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      } else {
        console.warn('⚠️ Audio data received but size is 0');
      }
    };

    recorder.onstart = () => {
      console.log('▶️ MediaRecorder started recording');
    };

    recorder.onstop = onStopHandler;

    recorder.onerror = (error) => {
      console.error('❌ MediaRecorder error:', error);
    };

    return recorder;
  }, []);

  // Whisper API with MediaRecorder
  const startListeningWhisper = useCallback(async () => {
    console.log('🎤 startListeningWhisper() called');
    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Microphone access granted');

      // Store stream for creating new recorders
      mediaStreamRef.current = stream;
      shouldContinueRecordingRef.current = true;

      // Try to find a Whisper-compatible MIME type
      const supportedMimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];

      let selectedMimeType = 'audio/webm'; // Default fallback
      for (const mimeType of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Using MIME type:', mimeType);
          break;
        }
      }

      currentMimeTypeRef.current = selectedMimeType;

      // Define the onstop handler that will be reused
      const handleStop = async () => {
        console.log('⏹️ MediaRecorder stopped, processing chunk...');
        await processAudioChunk();

        // Restart recording after processing if we should continue
        if (shouldContinueRecordingRef.current && mediaStreamRef.current) {
          try {
            // Create a NEW MediaRecorder (can't reuse stopped ones)
            const newRecorder = createMediaRecorder(mediaStreamRef.current, handleStop);
            newRecorder.start();
            mediaRecorderRef.current = newRecorder;
            console.log('🔄 MediaRecorder restarted with new instance');
          } catch (err) {
            console.error('❌ Failed to restart MediaRecorder:', err);
          }
        }
      };

      // Create initial MediaRecorder
      const mediaRecorder = createMediaRecorder(stream, handleStop);

      console.log('🎬 Starting MediaRecorder...');
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      setTranscriptionMode('whisper');
      setError(null);

      // Process audio every 10 seconds
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('⏱️ 10-second interval triggered, stopping to process chunk...');
          // Just stop - the onstop handler will process and restart
          mediaRecorderRef.current.stop();
        } else {
          console.warn('⚠️ MediaRecorder not recording, state:', mediaRecorderRef.current?.state);
        }
      }, 10000);

      console.log('✅ Started Whisper API transcription with MIME type:', selectedMimeType);

    } catch (err) {
      console.error('Failed to start audio capture:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setIsListening(false);
    }
  }, [processAudioChunk, createMediaRecorder]);

  // Main start function - tries Whisper first, falls back to browser if unavailable
  const startListening = useCallback(async () => {
    console.log('🎤 startListening() called');
    console.log('🎤 Whisper available:', whisperAvailable);
    console.log('🎤 OpenAI API Key configured:', !!import.meta.env.VITE_OPENAI_API_KEY);

    if (whisperAvailable) {
      console.log('🎤 Attempting to start Whisper API mode...');
      await startListeningWhisper();
    } else {
      console.log('🎤 Starting browser fallback mode...');
      startListeningBrowser();
    }
  }, [whisperAvailable, startListeningWhisper, startListeningBrowser]);

  const stopListening = useCallback(() => {
    // Signal that we should stop recording (prevents restart in onstop handler)
    shouldContinueRecordingRef.current = false;

    // Stop Whisper recording
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Clean up media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;

    // Stop browser recognition
    if (browserRecognitionRef.current) {
      browserRecognitionRef.current.stop();
      browserRecognitionRef.current = null;
    }

    setIsListening(false);
    setTranscriptionMode('idle');
  }, []);

  const clearBuffer = useCallback(() => {
    setConversationBuffer('');
    bufferTimestampsRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    conversationBuffer,
    clearBuffer,
    error,
    transcriptionMode,
    whisperAvailable
  };
}
