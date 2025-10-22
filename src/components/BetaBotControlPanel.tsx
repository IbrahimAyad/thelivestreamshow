import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition, WakeDetectionEvent, VisualSearchEvent } from '../hooks/useSpeechRecognition';
import { useTTS } from '../hooks/useTTS';
import { useF5TTS } from '../hooks/useF5TTS';
import { useOBSAudio } from '../hooks/useOBSAudio';
import { useDiscordAudio } from '../hooks/useDiscordAudio';
import { useBetaBotConversationWithMemory } from '../hooks/useBetaBotConversationWithMemory';
import { useBetaBotSuggestionsManager } from '../hooks/useBetaBotSuggestionsManager';
import { useSessionManager } from '../hooks/useSessionManager';
import { useConversationTiming } from '../hooks/useConversationTiming';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { calculateIntentScores, needsRealTimeData } from '../lib/intentDetection';
import { supabase } from '../lib/supabase';
import { SessionInfo } from './betabot/SessionInfo';
import { APIHealthStatus } from './betabot/APIHealthStatus';
import { LiveTranscript } from './betabot/LiveTranscript';
import { ChatHistory } from './betabot/ChatHistory';
import { SessionHistory } from './betabot/SessionHistory';
import { BetaBotSuggestions } from './betabot/BetaBotSuggestions';
import { LearningDashboard } from './betabot/LearningDashboard';
import { TimingIndicator } from './betabot/TimingIndicator';
import { EmotionIndicator } from './betabot/EmotionIndicator';
import { ModeSelection } from './betabot/ModeSelection';
import { TTSProviderSelector } from './betabot/TTSProviderSelector';
import { AudioSourceSelector } from './betabot/AudioSourceSelector';
import { MicrophoneSelector } from './betabot/MicrophoneSelector';
import { OBSConnectionPanel } from './betabot/OBSConnectionPanel';
import { VoiceSelector } from './betabot/VoiceSelector';
import { TextChatInput } from './betabot/TextChatInput';
import './BetaBotControlPanel.css';

export function BetaBotControlPanel() {
  // Mode selection: 'question-generator' or 'co-host'
  const [betaBotMode, setBetaBotMode] = useState<'question-generator' | 'co-host'>('co-host');

  const [directInteractions, setDirectInteractions] = useState(0);
  const [chatHistory, setChatHistory] = useState<Array<{
    question: string;
    answer: string;
    aiSource: 'gpt4' | 'perplexity';
    interactionId?: string;
    hasMemoryRecall?: boolean;
    memoryCount?: number;
  }>>([]);
  const [textInput, setTextInput] = useState('');
  const [currentAISource, setCurrentAISource] = useState<'gpt4' | 'perplexity' | null>(null);
  const [ttsProvider, setTtsProvider] = useState<'browser' | 'f5tts'>(() => {
    const saved = localStorage.getItem('betabot_tts_provider');
    const f5Enabled = import.meta.env.VITE_F5_TTS_ENABLED === 'true';
    return (saved as 'browser' | 'f5tts') || (f5Enabled ? 'f5tts' : 'browser');
  });
  const [showFallbackWarning, setShowFallbackWarning] = useState(false);

  // OBS Audio state
  const [audioSource, setAudioSource] = useState<'browser' | 'obs'>('browser');
  const [obsHost, setObsHost] = useState('192.168.1.199');
  const [obsPort, setObsPort] = useState(4455);
  const [obsPassword, setObsPassword] = useState('ZiALI1lrx90P03rf');
  const [obsAudioPort, setObsAudioPort] = useState(4456);

  // Microphone selection for browser mode
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');

  // Discord panel audio
  const [discordPanelListening, setDiscordPanelListening] = useState(false);
  const [discordExpanded, setDiscordExpanded] = useState(false);

  // Initialize hooks first (without callbacks)
  const betaBotConversation = useBetaBotConversationWithMemory();
  const browserTTS = useTTS();
  const f5TTS = useF5TTS();
  const obsAudio = useOBSAudio({
    host: obsHost,
    port: obsPort,
    password: obsPassword
  });
  const discordAudio = useDiscordAudio();

  // BetaBot suggestions management
  const betaBotSuggestionsManager = useBetaBotSuggestionsManager();

  // Smart timing detection
  const conversationTiming = useConversationTiming({
    silenceThreshold: 3000, // 3 seconds of silence
    topicShiftThreshold: 0.6, // 60% similarity for topic shifts
    minInterruptionScore: 0.7 // 70% confidence to recommend
  });

  // Emotion detection
  const emotionDetection = useEmotionDetection();

  // Select TTS provider based on user preference
  const tts = ttsProvider === 'f5tts' ? f5TTS : browserTTS;

  // Create a ref to hold speech recognition
  const speechRecognitionRef = useRef<any>(null);

  // Check if question needs real-time data
  const needsRealTimeData = (text: string): boolean => {
    const realtimeKeywords = ['weather', 'news', 'stock', 'price', 'today', 'current', 'latest', 'now', 'live', 'breaking'];
    const lowerText = text.toLowerCase();
    return realtimeKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Call Perplexity API for real-time questions
  const getPerplexityAnswer = async (question: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      console.log('🔴 Perplexity AI: Fetching real-time answer for:', question);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are Beta Bot, an AI co-host for a professional live stream. Provide concise, accurate, up-to-date answers (2-3 sentences maximum). Focus on recent information and real-time data. Be conversational and engaging.'
            },
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Perplexity API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer || answer.trim().length === 0) {
        throw new Error('Perplexity returned empty response');
      }

      console.log('✅ Perplexity answer received:', answer.substring(0, 100) + '...');
      return answer.trim();

    } catch (error) {
      console.error('❌ Perplexity API error:', error);
      // Re-throw so caller can handle fallback
      throw error;
    }
  };

  // Unified question handler for both wake phrase and text chat
  const handleQuestion = useCallback(async (question: string, source: 'wake_phrase' | 'text_chat') => {
    if (!question || question.length < 3) {
      console.log('Question too short, skipping');
      return;
    }

    const startTime = Date.now();

    try {
      console.log(`🎙️ Handling ${source} question: "${question}"`);

      // NEW: Priority-Based Intent Detection with Scoring
      // ===================================================

      // Build enhanced conversation context for intent detection
      const conversationContext = {
        hasRecentContext: betaBotConversation.context.history.length > 0 &&
                         (Date.now() - betaBotConversation.context.lastInteraction < 120000), // 2 minutes
        lastTimestamp: betaBotConversation.context.lastInteraction || undefined,
        turnCount: betaBotConversation.context.history.length,
        recentMessages: betaBotConversation.context.history.slice(-5).map(msg => msg.content),
        showContext: betaBotConversation.context.showContext // Include current episode/segment context
      };

      // Calculate intent scores with full context
      const intentResult = calculateIntentScores(question, conversationContext);

      console.log('🎯 Intent Detection Result:', {
        type: intentResult.type,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning
      });

      // Route based on intent type
      // ===========================

      if (intentResult.type === 'search_video') {
        console.log('📺 Routing to VIDEO search...');

        // Insert into betabot_media_browser table to trigger overlay
        await supabase.from('betabot_media_browser').insert([{
          search_query: question,
          content_type: 'videos',
          is_visible: true,
          created_at: new Date().toISOString()
        }]);

        console.log('✅ Media browser trigger inserted for videos');

        // Speak confirmation
        await tts.speak("Searching for videos now.");
        return; // Exit early
      }

      if (intentResult.type === 'search_web') {
        console.log('🔍 Routing to WEB search (Perplexity)...');

        // Log voice-activated filters if present
        if (intentResult.metadata) {
          console.log('🎤 Voice filters detected:', intentResult.metadata);
        }

        // Insert into betabot_media_browser table to trigger overlay
        await supabase.from('betabot_media_browser').insert([{
          search_query: question,
          content_type: 'images', // Database compatibility
          is_visible: true,
          created_at: new Date().toISOString(),
          metadata: intentResult.metadata || null
        }]);

        console.log('✅ Media browser trigger inserted for Perplexity search');
        return; // Exit early
      }

      if (intentResult.type === 'follow_up' || intentResult.type === 'conversation') {
        console.log(`💬 Routing to CONVERSATION mode (${intentResult.type})...`);

        // Use BetaBot conversation hook with emotion-aware mode selection
        let mode = intentResult.metadata?.mode || 'creative';

        // Override with emotion-detected mode if available and confident
        if (emotionDetection.recommendedMode && emotionDetection.recommendedMode.confidence > 0.7) {
          mode = emotionDetection.recommendedMode.recommendedMode;
          console.log(`🎭 Emotion-adjusted Mode: ${mode} (${emotionDetection.recommendedMode.reasoning})`);
        } else {
          console.log(`🎭 BetaBot Mode: ${mode}`);
        }

        // Generate unique interaction ID for feedback tracking
        const interactionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        let conversationResponse = '';
        let memoryRecallCount = 0;

        // Stream the response to TTS
        const streamedChunks: string[] = [];

        // Use memory-enhanced conversation
        const result = await betaBotConversation.chatWithMemory(
          question,
          mode,
          (chunk) => {
            // Collect chunks for streaming
            streamedChunks.push(chunk);
            conversationResponse += chunk;

            // Start speaking after we have a few words (more natural)
            if (streamedChunks.length === 5) {
              const firstSentence = streamedChunks.join('');
              tts.speak(firstSentence, async (state) => {
                if (sessionManager.sessionId) {
                  await supabase.from('betabot_sessions').update({
                    current_state: state === 'speaking' ? 'speaking' : 'listening'
                  }).eq('id', sessionManager.sessionId);
                }
              }).catch(err => console.error('TTS error:', err));
            }
          }
        );

        conversationResponse = result.response;
        memoryRecallCount = result.memoryRecallCount;

        console.log(`✅ BetaBot conversation complete (recalled ${memoryRecallCount} memories)`);

        // Speak the full response if it wasn't already spoken
        if (streamedChunks.length < 5 && conversationResponse) {
          await tts.speak(conversationResponse, async (state) => {
            if (sessionManager.sessionId) {
              await supabase.from('betabot_sessions').update({
                current_state: state === 'speaking' ? 'speaking' : 'listening'
              }).eq('id', sessionManager.sessionId);
            }
          });
        }

        // Log interaction
        if (sessionManager.sessionId) {
          await supabase.from('betabot_interactions').insert([{
            session_id: sessionManager.sessionId,
            interaction_type: source,
            user_input: question,
            bot_response: conversationResponse,
            ai_provider: 'conversation',
            response_time_ms: Date.now() - startTime,
            created_at: new Date().toISOString()
          }]);

          setDirectInteractions(prev => prev + 1);
        }

        // Add to chat history with memory metadata
        setChatHistory(prev => [{
          question,
          answer: conversationResponse,
          aiSource: 'gpt4', // Show as GPT-4 in UI
          interactionId,
          hasMemoryRecall: memoryRecallCount > 0,
          memoryCount: memoryRecallCount
        }, ...prev].slice(0, 5));

        return; // Exit early
      }

      // Get conversation buffer from ref
      const conversationBuffer = speechRecognitionRef.current?.conversationBuffer || '';

      // Generate unique interaction ID for feedback tracking
      const interactionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Determine which AI to use
      let response: string;
      let aiSource: 'gpt4' | 'perplexity';
      let memoryRecallCount = 0;

      if (needsRealTimeData(question)) {
        // Use Perplexity for real-time questions
        console.log('🔴 Routing to Perplexity AI for real-time data');
        setCurrentAISource('perplexity');
        aiSource = 'perplexity';
        response = await getPerplexityAnswer(question);
      } else {
        // Use GPT-4o with context awareness and memory
        console.log('🟢 Routing to BetaBot Conversation (GPT-4o with memory)');
        setCurrentAISource('gpt4');
        aiSource = 'gpt4';
        const result = await betaBotConversation.chatWithMemory(question, 'creative');
        response = result.response;
        memoryRecallCount = result.memoryRecallCount;
        console.log(`🧠 Recalled ${memoryRecallCount} past memories`);
      }

      const responseTime = Date.now() - startTime;

      if (response) {
        console.log(`✅ Got response in ${responseTime}ms: "${response.substring(0, 50)}..."`);

        // Add to chat history with memory metadata
        setChatHistory(prev => [{
          question,
          answer: response,
          aiSource,
          interactionId,
          hasMemoryRecall: memoryRecallCount > 0,
          memoryCount: memoryRecallCount
        }, ...prev].slice(0, 5));

        // Log interaction to database first (before speaking)
        if (sessionManager.sessionId) {
          // Log to betabot_interactions table
          await supabase.from('betabot_interactions').insert([{
            session_id: sessionManager.sessionId,
            interaction_type: source,
            user_input: question,
            bot_response: response,
            ai_provider: aiSource,
            response_time_ms: responseTime,
            created_at: new Date().toISOString()
          }]);

          // Log to betabot_conversation_log table
          await supabase.from('betabot_conversation_log').insert([{
            session_id: sessionManager.sessionId,
            transcript_text: `User: ${question}\nBeta Bot: ${response}`,
            audio_timestamp: sessionManager.sessionTimer,
            speaker_type: 'interaction'
          }]);

          // Update session metrics
          setDirectInteractions(prev => prev + 1);
          await supabase.from('betabot_sessions').update({
            total_direct_interactions: directInteractions + 1
          }).eq('id', sessionManager.sessionId);
        }

        // Speak the response with state change callback
        try {
          await tts.speak(response, async (state) => {
            // Update session state when TTS actually starts/stops speaking
            if (sessionManager.sessionId) {
              await supabase.from('betabot_sessions').update({
                current_state: state === 'speaking' ? 'speaking' : 'listening'
              }).eq('id', sessionManager.sessionId);
              console.log(`🎨 Updated session state to: ${state === 'speaking' ? 'speaking' : 'listening'}`);
            }
          });
        } catch (ttsError) {
          console.error('TTS failed, falling back to browser TTS:', ttsError);
          if (ttsProvider === 'f5tts') {
            setShowFallbackWarning(true);
            setTimeout(() => setShowFallbackWarning(false), 5000);
            await browserTTS.speak(response, async (state) => {
              // Same callback for fallback TTS
              if (sessionManager.sessionId) {
                await supabase.from('betabot_sessions').update({
                  current_state: state === 'speaking' ? 'speaking' : 'listening'
                }).eq('id', sessionManager.sessionId);
                console.log(`🎨 Updated session state to: ${state === 'speaking' ? 'speaking' : 'listening'}`);
              }
            });
          }
        }
      }

      // Clear AI source indicator after 2 seconds
      setTimeout(() => setCurrentAISource(null), 2000);
    } catch (error) {
      console.error('Error handling question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Speak error message
      try {
        await tts.speak(`Sorry, I encountered an error: ${errorMessage}`);
      } catch {
        console.error('Failed to speak error message');
      }

      setCurrentAISource(null);

      // Log error to database
      if (sessionManager.sessionId) {
        await supabase.from('betabot_interactions').insert([{
          session_id: sessionManager.sessionId,
          interaction_type: source,
          user_input: question,
          bot_response: `ERROR: ${errorMessage}`,
          ai_provider: null,
          response_time_ms: Date.now() - startTime,
          created_at: new Date().toISOString()
        }]);
      }
    }
  }, [directInteractions, betaBotConversation, tts, ttsProvider, browserTTS]); // sessionManager accessed directly, not in deps

  // Wake phrase handler - doesn't use speechRecognition in dependencies
  const handleWakePhraseDetected = useCallback(async (event: WakeDetectionEvent) => {
    console.log(`🎙️ Wake phrase "${event.phrase}" detected! Context: "${event.context}"`);
    await handleQuestion(event.context, 'wake_phrase');
  }, [handleQuestion]);

  // Visual search handler
  const handleVisualSearchDetected = useCallback(async (event: VisualSearchEvent) => {
    console.log(`🔍 Visual search command detected! Query: "${event.query}"`);

    try {
      // Log interaction
      if (sessionManager.sessionId) {
        const { error } = await supabase.from('betabot_interactions').insert([{
          session_id: sessionManager.sessionId,
          interaction_type: 'visual_search',
          user_input: event.query,
          timestamp: new Date().toISOString()
        }]);

        if (error) console.error('Error logging visual search interaction:', error);
      }

      // Trigger media browser overlay
      console.log('🌐 Triggering media browser overlay for query:', event.query);

      // Smart detection for videos vs images
      const query = event.query.toLowerCase();

      // Video keywords
      const videoKeywords = [
        'video', 'videos', 'clip', 'clips', 'shorts', 'short',
        'trending', 'viral', 'popular', 'latest', 'recent',
        'watch', 'show me', 'pull up', 'find',
        'youtube', 'reddit'
      ];

      // Popular channel names
      const channelNames = [
        'joe rogan', 'jre', 'lex fridman',
        'mkbhd', 'marques brownlee', 'linus tech tips',
        'mrbeast', 'pewdiepie', 'ninja',
        'espn', 'cnn'
      ];

      // Check if query mentions videos explicitly or channels
      const hasVideoKeyword = videoKeywords.some(keyword => query.includes(keyword));
      const hasChannelName = channelNames.some(channel => query.includes(channel));

      const type = (hasVideoKeyword || hasChannelName) ? 'videos' : 'images';

      console.log(`📺 Detected content type: ${type} (videoKeyword: ${hasVideoKeyword}, channel: ${hasChannelName})`);

      const { data, error } = await supabase.from('betabot_media_browser').insert([{
        search_query: event.query,
        content_type: type,
        session_id: sessionManager.sessionId,
        is_visible: true
      }]).select();

      if (error) {
        console.error('❌ Error triggering media browser:', JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`);
      }

      console.log('✅ Media browser overlay triggered:', data);

      // Speak confirmation with callback to update session state
      tts.speak(`Looking that up for you...`, async (state) => {
        if (sessionManager.sessionId) {
          await supabase.from('betabot_sessions').update({
            current_state: state === 'speaking' ? 'speaking' : 'listening'
          }).eq('id', sessionManager.sessionId);
        }
      });
    } catch (error) {
      console.error('Error handling visual search:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      tts.speak(`Sorry, search failed: ${errorMessage}`);
    }
  }, [tts]); // sessionManager accessed directly, not in deps

  // Initialize speech recognition with callbacks NOW
  // Only enable wake phrase detection in Co-Host mode
  const speechRecognition = useSpeechRecognition({
    onWakePhraseDetected: betaBotMode === 'co-host' ? handleWakePhraseDetected : undefined,
    onVisualSearchDetected: betaBotMode === 'co-host' ? handleVisualSearchDetected : undefined,
    microphoneDeviceId: selectedMicrophoneId
  });

  // Session management
  const sessionManager = useSessionManager({
    generatedQuestionsCount: 0, // Deprecated - Producer AI now handles question generation
    directInteractions,
    conversationBuffer: speechRecognition.conversationBuffer,
    onStopListening: () => speechRecognition.stopListening(),
    onClearBuffer: () => speechRecognition.clearBuffer(),
    onResetChatState: async () => {
      // Store conversation as memory before resetting
      if (sessionManager.sessionId && speechRecognition.conversationBuffer.length > 100) {
        console.log('💾 Storing session conversation as memory...');
        try {
          await betaBotConversation.storeConversationMemory(
            sessionManager.sessionId,
            speechRecognition.conversationBuffer,
            {
              topic: 'Live Stream Session',
              contextMetadata: {
                duration: sessionManager.sessionTimer,
                interactions: directInteractions
              }
            }
          );
          console.log('✅ Session memory stored successfully');
        } catch (error) {
          console.error('❌ Failed to store session memory:', error);
        }
      }

      // Reset UI state
      setChatHistory([]);
      setCurrentAISource(null);
      setDirectInteractions(0);
    }
  });

  // Store in ref for callbacks
  useEffect(() => {
    speechRecognitionRef.current = speechRecognition;
  }, [speechRecognition]);

  // Analyze transcript timing whenever new transcript arrives
  useEffect(() => {
    if (speechRecognition.transcript && speechRecognition.isListening) {
      const analyzeAsync = async () => {
        await conversationTiming.analyzeTranscript(
          speechRecognition.transcript,
          Date.now()
        );

        // Log timing opportunities for debugging
        if (conversationTiming.timingOpportunity) {
          console.log('⏱️ Timing Opportunity:', {
            score: conversationTiming.timingOpportunity.score,
            recommendation: conversationTiming.timingOpportunity.recommendation,
            reasoning: conversationTiming.timingOpportunity.reasoning,
            energy: conversationTiming.currentEnergy
          });
        }
      };

      analyzeAsync();
    }
  }, [speechRecognition.transcript, speechRecognition.isListening]);

  // Analyze transcript for emotions (text-based fallback)
  useEffect(() => {
    if (speechRecognition.transcript && speechRecognition.isListening) {
      // Use text-based emotion detection as a lightweight fallback
      emotionDetection.analyzeText(speechRecognition.transcript);
    }
  }, [speechRecognition.transcript, speechRecognition.isListening]);

  // Create session when listening starts
  useEffect(() => {
    if (speechRecognition.isListening && !sessionManager.sessionId) {
      sessionManager.createSession();
    }
  }, [speechRecognition.isListening, sessionManager.sessionId]);

  // Handle OBS audio when source is OBS
  useEffect(() => {
    if (audioSource === 'obs' && speechRecognition.isListening && obsAudio.connected && obsAudio.selectedSource) {
      console.log('🎬 Setting up OBS audio capture...');

      // Set up audio chunk processing
      obsAudio.onAudioChunk((chunk) => {
        console.log('🎤 OBS audio chunk received:', chunk.data.length, 'samples');
      });

      // Process audio every 5 seconds
      const interval = setInterval(async () => {
        const audioBlob = await obsAudio.getAudioBlob();
        if (audioBlob) {
          console.log('📡 Processing OBS audio blob:', audioBlob.size, 'bytes');
          await speechRecognition.processAudioBlob(audioBlob);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [audioSource, speechRecognition.isListening, obsAudio.connected, obsAudio.selectedSource]);

  // Enumerate available microphones on mount
  useEffect(() => {
    const enumerateMicrophones = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');

        console.log('🎤 Available microphones:', audioInputs);
        setAvailableMicrophones(audioInputs);

        // Set default to first device if none selected
        if (!selectedMicrophoneId && audioInputs.length > 0) {
          setSelectedMicrophoneId(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Failed to enumerate microphones:', error);
      }
    };

    enumerateMicrophones();
  }, []);

  // Load Piper voices when f5TTS is connected
  useEffect(() => {
    if (ttsProvider === 'f5tts' && f5TTS.isConnected && f5TTS.voices.length === 0) {
      console.log('Loading Piper voices...');
      f5TTS.loadVoices();
    }
  }, [ttsProvider, f5TTS.isConnected]);

  const exportTranscript = () => {
    const transcript = speechRecognition.conversationBuffer;
    if (!transcript) {
      alert('No transcript available to export');
      return;
    }

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betabot-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestTTS = async () => {
    console.log("Testing TTS...");
    try {
      await tts.speak("Hello! I am Beta Bot, your AI co-host. Text-to-speech is working correctly! This is a test of the speech synthesis system.");
    } catch (error) {
      console.error('TTS test failed:', error);
      if (ttsProvider === 'f5tts') {
        setShowFallbackWarning(true);
        setTimeout(() => setShowFallbackWarning(false), 5000);
        await browserTTS.speak("F5-TTS is not available. Falling back to browser TTS. Hello! I am Beta Bot.");
      }
    }
  };

  const handleTextChatSubmit = async () => {
    if (!textInput.trim()) return;
    
    const question = textInput.trim();
    setTextInput('');
    
    // Read the question aloud with fallback
    try {
      await tts.speak(`You asked: ${question}`);
    } catch (error) {
      console.error('TTS failed reading question:', error);
      if (ttsProvider === 'f5tts') {
        await browserTTS.speak(`You asked: ${question}`);
      }
    }
    
    // Wait a moment, then answer
    setTimeout(() => {
      handleQuestion(question, 'text_chat');
    }, 1500);
  };

  const handlePreviewVoice = () => {
    if (browserTTS.selectedVoice) {
      browserTTS.speak(`Hello! This is the ${browserTTS.selectedVoice.name} voice. I am Beta Bot, your AI co-host.`);
    }
  };

  return (
    <div className="betabot-control-panel" data-betabot-panel>
      <div className="panel-header">
        <h3>🤖 Beta Bot</h3>
        <div className="status-indicator">
          <div className={`status-dot ${speechRecognition.isListening ? 'listening' : tts.isSpeaking ? 'speaking' : 'idle'}`} />
          <span>{speechRecognition.isListening ? 'Listening' : tts.isSpeaking ? 'Speaking' : 'Ready'}</span>
          {speechRecognition.transcriptionMode !== 'idle' && (
            <span className="mode-badge">{speechRecognition.transcriptionMode === 'whisper' ? '🎯 Whisper' : '🌐 Browser'}</span>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <ModeSelection
        betaBotMode={betaBotMode}
        isListening={speechRecognition.isListening}
        onModeChange={setBetaBotMode}
      />

      {/* TTS Provider Selection - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
        <TTSProviderSelector
          ttsProvider={ttsProvider}
          onProviderChange={setTtsProvider}
          f5TTSConnected={f5TTS.isConnected}
          f5TTSError={f5TTS.error}
          showFallbackWarning={showFallbackWarning}
        />
      )}

      {/* Audio Source Selection */}
      <AudioSourceSelector
        audioSource={audioSource}
        isListening={speechRecognition.isListening}
        onSourceChange={setAudioSource}
      />

      {/* Microphone Selection - Only show when Browser mode */}
      {audioSource === 'browser' && (
        <MicrophoneSelector
          selectedMicrophoneId={selectedMicrophoneId}
          availableMicrophones={availableMicrophones}
          isListening={speechRecognition.isListening}
          onMicrophoneChange={setSelectedMicrophoneId}
        />
      )}

      {/* OBS Connection Settings - Only show when OBS is selected */}
      {audioSource === 'obs' && (
        <OBSConnectionPanel
          obsConnected={obsAudio.connected}
          obsError={obsAudio.error}
          obsHost={obsHost}
          obsPort={obsPort}
          obsPassword={obsPassword}
          obsAudioPort={obsAudioPort}
          obsAudioSources={obsAudio.audioSources}
          selectedSource={obsAudio.selectedSource}
          onHostChange={setObsHost}
          onPortChange={setObsPort}
          onPasswordChange={setObsPassword}
          onAudioPortChange={setObsAudioPort}
          onConnect={obsAudio.connect}
          onDisconnect={obsAudio.disconnect}
          onSourceSelect={obsAudio.startAudioCapture}
        />
      )}

      {/* Discord Panel Audio - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
        <div className="discord-panel-compact">
          <div className="discord-header" onClick={() => setDiscordExpanded(!discordExpanded)}>
            <span>🎮 Discord Panel</span>
            <div className={`discord-status ${discordAudio.state.connected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot" />
              <span>{discordAudio.state.connected ? 'Connected' : 'Offline'}</span>
            </div>
            <button className="btn-expand">{discordExpanded ? '▼' : '▶'}</button>
          </div>

          {discordExpanded && (
            <div className="discord-panel-content">
              {discordAudio.state.panelMembersCount > 0 && (
                <div className="panel-members-count">{discordAudio.state.panelMembersCount} panel members</div>
              )}

              <div className="discord-controls">
                <button
                  className={`btn-discord ${discordPanelListening ? 'active' : ''}`}
                  onClick={async () => {
                    if (discordPanelListening) {
                      discordAudio.stopReceiving();
                      setDiscordPanelListening(false);
                    } else {
                      try {
                        setDiscordPanelListening(true);
                        console.log('✅ Discord panel listening enabled');
                      } catch (error) {
                        console.error('Failed to start Discord listening:', error);
                        setDiscordPanelListening(false);
                      }
                    }
                  }}
                  disabled={!discordAudio.state.connected}
                >
                  {discordPanelListening ? '🔇 Stop Panel Listening' : '🎤 Listen to Panel'}
                </button>
                <button
                  className="btn-test-connection"
                  onClick={() => discordAudio.checkConnection()}
                >
                  🔄 Check Connection
                </button>
              </div>

              <details className="discord-setup-details">
                <summary>💡 Audio Routing Setup</summary>
                <div className="setup-info">
                  <p>See <code>DISCORD_AUDIO_INTEGRATION.md</code> for complete setup guide.</p>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Voice Selection - Only show for browser TTS in Co-Host mode */}
      {betaBotMode === 'co-host' && ttsProvider === 'browser' && (
        <VoiceSelector
          mode="browser"
          voices={browserTTS.voices}
          selectedVoice={browserTTS.selectedVoice}
          isSpeaking={browserTTS.isSpeaking}
          onVoiceChange={browserTTS.setSelectedVoice}
          onPreview={handlePreviewVoice}
        />
      )}

      {/* Piper Voice Selection - Only show for F5-TTS (Piper) in Co-Host mode */}
      {betaBotMode === 'co-host' && ttsProvider === 'f5tts' && f5TTS.isConnected && (
        <VoiceSelector
          mode="piper"
          voices={f5TTS.voices}
          selectedVoice={f5TTS.selectedVoice}
          isSpeaking={f5TTS.isSpeaking}
          onVoiceChange={f5TTS.setSelectedVoice}
          onPreview={() => f5TTS.speak("Hello! This is a test of the Piper text to speech system.")}
        />
      )}

      {/* Text Chat Input - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
        <TextChatInput
          textInput={textInput}
          sessionId={sessionManager.sessionId}
          isResponding={betaBotConversation.isResponding}
          isSpeaking={tts.isSpeaking}
          currentAISource={currentAISource}
          onTextChange={setTextInput}
          onSubmit={handleTextChatSubmit}
        />
      )}

      {/* Chat History - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
        <ChatHistory chatHistory={chatHistory} />
      )}

      {/* Learning Dashboard - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
        <LearningDashboard />
      )}

      {/* Timing Indicator - Only show when listening in Co-Host mode */}
      {betaBotMode === 'co-host' && speechRecognition.isListening && (
        <TimingIndicator
          timingOpportunity={conversationTiming.timingOpportunity}
          currentEnergy={conversationTiming.currentEnergy}
          totalSignals={conversationTiming.totalSignalsDetected}
        />
      )}

      {/* Emotion Indicator - Only show when listening in Co-Host mode */}
      {betaBotMode === 'co-host' && speechRecognition.isListening && (
        <EmotionIndicator
          currentEmotion={emotionDetection.currentEmotion}
          recommendedMode={emotionDetection.recommendedMode}
          isAnalyzing={emotionDetection.isAnalyzing}
        />
      )}

      {/* Main Controls */}
      <div className="controls-section">
        <button
          className={`btn-control ${speechRecognition.isListening ? 'active' : ''}`}
          onClick={() => {
            if (speechRecognition.isListening) {
              sessionManager.endSession(0); // Producer AI now handles question generation
            } else {
              // Only start browser mic listening if browser source is selected
              // OBS audio is handled separately via the OBS connection
              if (audioSource === 'browser') {
                speechRecognition.startListening();
              } else if (audioSource === 'obs') {
                // For OBS, just mark as listening - audio comes from OBS hook
                if (!obsAudio.connected || !obsAudio.selectedSource) {
                  alert('Please connect to OBS and select an audio source first');
                  return;
                }
                // Set internal state to "listening" to activate the session
                speechRecognition.setAudioSource('obs');
                sessionManager.createSession();
              }
            }
          }}
          disabled={audioSource === 'obs' && (!obsAudio.connected || !obsAudio.selectedSource)}
        >
          {speechRecognition.isListening ? '⏹ End Session' : '▶️ Start Session'}
        </button>

        <button
          className="btn-control btn-export"
          onClick={exportTranscript}
          disabled={!speechRecognition.conversationBuffer}
        >
          📥 Export Transcript
        </button>

        <button
          className="btn-control btn-test"
          onClick={handleTestTTS}
          disabled={tts.isSpeaking}
        >
          🎵 Test Voice
        </button>
      </div>

      {/* Session Info */}
      {sessionManager.sessionId && (
        <SessionInfo
          sessionTimer={sessionManager.sessionTimer}
          generatedQuestions={0} // Producer AI now handles question generation
          directInteractions={directInteractions}
          totalWords={speechRecognition.conversationBuffer.split(/\s+/).filter(w => w.length > 0).length}
        />
      )}

      {/* API Health Status */}
      <APIHealthStatus
        betaBotStatus={betaBotConversation.error ? 'error' : betaBotConversation.isResponding ? 'warning' : 'healthy'}
        whisperAvailable={speechRecognition.whisperAvailable}
      />

      {/* Live Transcript */}
      {speechRecognition.transcript && (
        <LiveTranscript transcript={speechRecognition.transcript} />
      )}

      {/* Session History */}
      <SessionHistory
        sessionHistory={sessionManager.sessionHistory}
        showHistory={sessionManager.showHistory}
        onToggle={() => sessionManager.setShowHistory(!sessionManager.showHistory)}
      />

      {/* BetaBot Suggestions - Questions Generated from Conversation */}
      <BetaBotSuggestions
        suggestions={betaBotSuggestionsManager.suggestions}
        onAddToQueue={betaBotSuggestionsManager.addToPopupQueue}
        onDismiss={betaBotSuggestionsManager.dismiss}
      />

    </div>
  );
}
