import { useState, useRef, useCallback, useEffect } from 'react';

// Configuration constants
const MAX_RECORDING_DURATION = 30000; // 30 seconds
const TRANSCRIPT_MIN_LENGTH = 5; // Minimum characters for DB save
const WINDOW_SIZE = 5; // Rolling window for duplicate detection

interface WakePhraseEvent {
  phrase: string;
  context: string;
}

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  onWakePhraseDetected?: (event: WakePhraseEvent) => void;
  apiKey?: string;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'listening' | 'recording' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Refs for managing audio recording and recognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferRef = useRef<string[]>([]);
  const lastProcessedRef = useRef<string>('');

  // Wake phrase patterns (case-insensitive)
  const wakePhrases = [
    'beta bot',
    'hey beta bot',
    'betabot',
    'hey betabot'
  ];

  /**
   * Detect wake phrase in transcript
   */
  const detectWakePhrase = useCallback((text: string): WakePhraseEvent | null => {
    const lowerText = text.toLowerCase();
    
    for (const phrase of wakePhrases) {
      const index = lowerText.indexOf(phrase);
      if (index !== -1) {
        const context = text.substring(index + phrase.length).trim();
        return { phrase, context };
      }
    }
    return null;
  }, []);

  /**
   * Browser Speech Recognition (fallback method)
   */
  const startBrowserSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Browser speech recognition started');
      setCurrentStatus('listening');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        processTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setCurrentStatus('idle');
    };

    recognition.onend = () => {
      console.log('🔇 Speech recognition ended');
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition restart failed, stopping:', e);
          stopListening();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

  /**
   * Whisper API Transcription (primary method)
   */
  const startWhisperTranscription = useCallback(async () => {
    if (!options.apiKey) {
      throw new Error('OpenAI API key required for Whisper transcription');
    }

    console.log('🎤 Starting Whisper transcription (using OpenAI API)');

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      console.log('🔴 Recording started');
      setIsRecording(true);
      setCurrentStatus('recording');
      setTimeRemaining(MAX_RECORDING_DURATION);

      // Start countdown timer
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MAX_RECORDING_DURATION - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0 || !isRecording) {
          clearInterval(interval);
        }
      }, 100);

      // Auto-stop after max duration
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stopping after 30 seconds');
        stopRecording();
      }, MAX_RECORDING_DURATION);
    };

    mediaRecorder.onstop = async () => {
      console.log('⏹️ Recording stopped, processing audio...');
      setCurrentStatus('processing');
      setIsRecording(false);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Process audio with Whisper
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeWithWhisper(audioBlob);
      }

      // If still listening, restart recording
      if (isListening) {
        setTimeout(() => {
          if (mediaRecorderRef.current && isListening) {
            try {
              audioChunksRef.current = [];
              mediaRecorderRef.current.start();
            } catch (e) {
              console.error('Failed to restart recording:', e);
              stopListening();
            }
          }
        }, 100);
      }
    };

    mediaRecorder.onerror = (event: any) => {
      console.error('MediaRecorder error:', event.error);
      setError(`Recording error: ${event.error}`);
      stopListening();
    };

    // Start recording
    try {
      mediaRecorder.start(1000); // Collect data every second
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e);
      throw e;
    }
  }, [options.apiKey, isListening, isRecording]);

  /**
   * Transcribe audio using Whisper API
   */
  const transcribeWithWhisper = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const data = await response.json();
      const transcriptText = data.text?.trim();

      if (transcriptText) {
        processTranscript(transcriptText);
      }
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      setError(`Transcription failed: ${error.message}`);
    }
  }, [options.apiKey]);

  /**
   * Process transcript for wake phrase and save to database
   */
  const processTranscript = useCallback((text: string) => {
    const trimmedText = text.trim().toLowerCase();

    if (!trimmedText) return;

    console.log('📝 Transcript received:', trimmedText);

    // Add to rolling buffer for duplicate detection
    bufferRef.current.push(trimmedText);
    if (bufferRef.current.length > WINDOW_SIZE) {
      bufferRef.current.shift();
    }

    // Check for duplicates
    const occurrences = bufferRef.current.filter(t => t === trimmedText).length;
    if (occurrences > 1 && trimmedText === lastProcessedRef.current) {
      console.log('⏭️ Skipping duplicate transcript:', trimmedText);
      return;
    }

    lastProcessedRef.current = trimmedText;

    // Add to conversation buffer
    const conversationBuffer = bufferRef.current.join(' ');

    // Check wake phrase FIRST (before validation)
    const wakeEvent = detectWakePhrase(conversationBuffer);
    if (wakeEvent && options.onWakePhraseDetected) {
      console.log('✅ Wake phrase detected:', wakeEvent);
      options.onWakePhraseDetected(wakeEvent);
    }

    // Validate for database save
    if (trimmedText.length < TRANSCRIPT_MIN_LENGTH) {
      console.log('⏭️ Skipping short transcript DB save (<5 chars):', trimmedText);
      return;
    }

    // Save to database
    options.onTranscript(conversationBuffer);
    setTranscript(conversationBuffer);
  }, [detectWakePhrase, options]);

  /**
   * Start listening
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setIsListening(true);
      setCurrentStatus('listening');
      bufferRef.current = [];
      lastProcessedRef.current = '';

      // Try Whisper first, fallback to browser speech recognition
      if (options.apiKey) {
        await startWhisperTranscription();
      } else {
        startBrowserSpeechRecognition();
      }
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      setError(error.message);
      setIsListening(false);
      setCurrentStatus('idle');
    }
  }, [options.apiKey, startWhisperTranscription, startBrowserSpeechRecognition]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping speech recognition...');

    setIsListening(false);
    setCurrentStatus('idle');
    setTimeRemaining(0);

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
      recognitionRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Clear buffers
    audioChunksRef.current = [];
    bufferRef.current = [];

    console.log('✅ Speech recognition stopped');
  }, []);

  /**
   * Stop recording only (for Whisper mode)
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isRecording,
    currentStatus,
    error,
    transcript,
    timeRemaining,
    startListening,
    stopListening,
    stopRecording,
    clearError: () => setError(null),
    clearTranscript: () => setTranscript('')
  };
};
