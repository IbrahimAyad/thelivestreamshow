import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition, WakeDetectionEvent, VisualSearchEvent } from '../hooks/useSpeechRecognition';
import { useBetaBotAI } from '../hooks/useBetaBotAI';
import { useTTS } from '../hooks/useTTS';
import { useF5TTS } from '../hooks/useF5TTS';
import { useOBSAudio } from '../hooks/useOBSAudio';
import { supabase } from '../lib/supabase';

interface SessionHistory {
  id: string;
  session_name: string;
  created_at: string;
  total_questions_generated: number;
  total_direct_interactions: number;
  total_transcript_words: number;
}

export function BetaBotControlPanel() {
  // Mode selection: 'question-generator' or 'co-host'
  const [betaBotMode, setBetaBotMode] = useState<'question-generator' | 'co-host'>('co-host');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<Array<{text: string; context: string}>>([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [autoGenerateInterval, setAutoGenerateInterval] = useState(300); // 5 minutes default
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [directInteractions, setDirectInteractions] = useState(0);
  const [chatHistory, setChatHistory] = useState<Array<{question: string; answer: string; aiSource: string}>>([]);
  const [textInput, setTextInput] = useState('');
  const [currentAISource, setCurrentAISource] = useState<'gpt4' | 'perplexity' | null>(null);
  const [ttsProvider, setTtsProvider] = useState<'browser' | 'f5tts'>(() => {
    const saved = localStorage.getItem('betabot_tts_provider');
    const f5Enabled = import.meta.env.VITE_F5_TTS_ENABLED === 'true';
    return (saved as 'browser' | 'f5tts') || (f5Enabled ? 'f5tts' : 'browser');
  });
  const [showFallbackWarning, setShowFallbackWarning] = useState(false);
  const [autoQuestionGenInterval, setAutoQuestionGenInterval] = useState(60); // seconds
  const [betaBotSuggestions, setBetaBotSuggestions] = useState<Array<{
    id: string;
    question_text: string;
    context_metadata: any;
    created_at: string;
  }>>([]);

  // OBS Audio state
  const [audioSource, setAudioSource] = useState<'browser' | 'obs'>('browser');
  const [obsHost, setObsHost] = useState('192.168.1.199');
  const [obsPort, setObsPort] = useState(4455);
  const [obsPassword, setObsPassword] = useState('ZiALI1lrx90P03rf');
  const [obsAudioPort, setObsAudioPort] = useState(4456);

  // Microphone selection for browser mode
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');

  // Initialize hooks first (without callbacks)
  const betaBotAI = useBetaBotAI();
  const browserTTS = useTTS();
  const f5TTS = useF5TTS();
  const obsAudio = useOBSAudio({
    host: obsHost,
    port: obsPort,
    password: obsPassword
  });

  // Select TTS provider based on user preference
  const tts = ttsProvider === 'f5tts' ? f5TTS : browserTTS;

  // Create a ref to hold speech recognition
  const speechRecognitionRef = useRef<any>(null);
  const autoQuestionGenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuestionGenTimeRef = useRef<number>(0);

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

      // Get conversation buffer from ref
      const conversationBuffer = speechRecognitionRef.current?.conversationBuffer || '';

      // Determine which AI to use
      let response: string;
      let aiSource: 'gpt4' | 'perplexity';

      if (needsRealTimeData(question)) {
        // Use Perplexity for real-time questions
        console.log('🔴 Routing to Perplexity AI for real-time data');
        setCurrentAISource('perplexity');
        aiSource = 'perplexity';
        response = await getPerplexityAnswer(question);
      } else {
        // Use GPT-4 for general questions
        console.log('🟢 Routing to GPT-4 for general question');
        setCurrentAISource('gpt4');
        aiSource = 'gpt4';
        response = await betaBotAI.respondToQuestion(question, conversationBuffer);
      }

      const responseTime = Date.now() - startTime;

      if (response) {
        console.log(`✅ Got response in ${responseTime}ms: "${response.substring(0, 50)}..."`);

        // Add to chat history
        setChatHistory(prev => [{question, answer: response, aiSource}, ...prev].slice(0, 5));

        // Log interaction to database first (before speaking)
        if (sessionId) {
          // Log to betabot_interactions table
          await supabase.from('betabot_interactions').insert([{
            session_id: sessionId,
            interaction_type: source,
            user_input: question,
            bot_response: response,
            ai_provider: aiSource,
            response_time_ms: responseTime,
            created_at: new Date().toISOString()
          }]);

          // Log to betabot_conversation_log table
          await supabase.from('betabot_conversation_log').insert([{
            session_id: sessionId,
            transcript_text: `User: ${question}\nBeta Bot: ${response}`,
            audio_timestamp: sessionTimer,
            speaker_type: 'interaction'
          }]);

          // Update session metrics
          setDirectInteractions(prev => prev + 1);
          await supabase.from('betabot_sessions').update({
            total_direct_interactions: directInteractions + 1
          }).eq('id', sessionId);
        }

        // Speak the response with state change callback
        try {
          await tts.speak(response, async (state) => {
            // Update session state when TTS actually starts/stops speaking
            if (sessionId) {
              await supabase.from('betabot_sessions').update({
                current_state: state === 'speaking' ? 'speaking' : 'listening'
              }).eq('id', sessionId);
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
              if (sessionId) {
                await supabase.from('betabot_sessions').update({
                  current_state: state === 'speaking' ? 'speaking' : 'listening'
                }).eq('id', sessionId);
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
      if (sessionId) {
        await supabase.from('betabot_interactions').insert([{
          session_id: sessionId,
          interaction_type: source,
          user_input: question,
          bot_response: `ERROR: ${errorMessage}`,
          ai_provider: null,
          response_time_ms: Date.now() - startTime,
          created_at: new Date().toISOString()
        }]);
      }
    }
  }, [sessionId, directInteractions, betaBotAI, tts, sessionTimer, ttsProvider, browserTTS]);

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
      if (sessionId) {
        const { error } = await supabase.from('betabot_interactions').insert([{
          session_id: sessionId,
          interaction_type: 'visual_search',
          user_input: event.query,
          timestamp: new Date().toISOString()
        }]);

        if (error) console.error('Error logging visual search interaction:', error);
      }

      // Trigger media browser overlay (no Perplexity search needed - Google does it all!)
      console.log('🌐 Triggering media browser overlay for query:', event.query);

      // Determine if it's images or videos based on keywords
      const type = event.query.toLowerCase().includes('video') ? 'videos' : 'images';

      const { data, error } = await supabase.from('betabot_media_browser').insert([{
        search_query: event.query,
        content_type: type,
        session_id: sessionId,
        is_visible: true
      }]).select();

      if (error) {
        console.error('❌ Error triggering media browser:', JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}`);
      }

      console.log('✅ Media browser overlay triggered:', data);

      // Speak confirmation with callback to update session state
      tts.speak(`Showing ${type} for ${event.query}`, async (state) => {
        if (sessionId) {
          await supabase.from('betabot_sessions').update({
            current_state: state === 'speaking' ? 'speaking' : 'listening'
          }).eq('id', sessionId);
        }
      });
    } catch (error) {
      console.error('Error handling visual search:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      tts.speak(`Sorry, search failed: ${errorMessage}`);
    }
  }, [sessionId, tts]);

  // Initialize speech recognition with callbacks NOW
  // Only enable wake phrase detection in Co-Host mode
  const speechRecognition = useSpeechRecognition({
    onWakePhraseDetected: betaBotMode === 'co-host' ? handleWakePhraseDetected : undefined,
    onVisualSearchDetected: betaBotMode === 'co-host' ? handleVisualSearchDetected : undefined,
    microphoneDeviceId: selectedMicrophoneId
  });

  // Store in ref for callbacks
  useEffect(() => {
    speechRecognitionRef.current = speechRecognition;
  }, [speechRecognition]);

  // Session timer
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Automatic question generation loop - runs when listening and has conversation content
  useEffect(() => {
    // Clear any existing timer
    if (autoQuestionGenTimerRef.current) {
      clearInterval(autoQuestionGenTimerRef.current);
      autoQuestionGenTimerRef.current = null;
    }

    // Only run auto-generation when actively listening with content
    if (!speechRecognition.isListening || !sessionId) {
      console.log('Auto question generation: Disabled (not listening or no session)');
      return;
    }

    console.log(`🤖 Auto question generation: Enabled (every ${autoQuestionGenInterval}s)`);

    // Set up the interval
    autoQuestionGenTimerRef.current = setInterval(async () => {
      // Only generate if we have sufficient conversation content
      if (speechRecognition.conversationBuffer && speechRecognition.conversationBuffer.split(' ').length >= 50) {
        console.log('⏰ Auto-generating questions based on conversation...');
        await handleGenerateQuestions();
      } else {
        console.log('⏰ Skipping auto-generation - not enough conversation content yet');
      }
    }, autoQuestionGenInterval * 1000);

    return () => {
      if (autoQuestionGenTimerRef.current) {
        clearInterval(autoQuestionGenTimerRef.current);
        autoQuestionGenTimerRef.current = null;
      }
    };
  }, [speechRecognition.isListening, sessionId, autoQuestionGenInterval]);

  // Legacy auto-generate toggle (kept for manual control)
  useEffect(() => {
    if (!autoGenerate || !sessionId || !speechRecognition.conversationBuffer) return;

    const interval = setInterval(async () => {
      console.log('⏰ Manual auto-generate triggered...');
      await handleGenerateQuestions();
    }, autoGenerateInterval * 1000);

    return () => clearInterval(interval);
  }, [autoGenerate, sessionId, autoGenerateInterval, speechRecognition.conversationBuffer]);

  // Create session when listening starts
  useEffect(() => {
    if (speechRecognition.isListening && !sessionId) {
      createSession();
    }
  }, [speechRecognition.isListening, sessionId]);

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

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory();
    loadBetaBotSuggestions();
  }, []);

  // Subscribe to new BetaBot suggestions
  useEffect(() => {
    const suggestionsChannel = supabase
      .channel('betabot_suggestions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'show_questions',
        filter: 'source=eq.betabot_conversation_helper'
      }, () => {
        loadBetaBotSuggestions();
      })
      .subscribe();

    return () => {
      suggestionsChannel.unsubscribe();
    };
  }, []);

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('betabot_sessions')
        .insert([{ 
          session_name: `Session ${new Date().toLocaleString()}`, 
          is_active: true,
          current_state: 'listening'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      setSessionId(data.id);
      setSessionTimer(0);
      setGeneratedQuestions([]);
      setDirectInteractions(0);
      console.log('✅ Session created successfully:', data.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to create session:', errorMessage, error);
      alert(`Failed to create session: ${errorMessage}\n\nPlease check the console for details.`);
      speechRecognition.stopListening();
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      console.log('🛑 Ending Beta Bot session...');

      // Stop auto-question generation
      if (autoQuestionGenTimerRef.current) {
        clearInterval(autoQuestionGenTimerRef.current);
        autoQuestionGenTimerRef.current = null;
      }

      // Calculate final metrics
      const wordCount = speechRecognition.conversationBuffer.split(/\s+/).filter(w => w.length > 0).length;
      const sessionDuration = sessionTimer;

      // Log final transcript to conversation log
      if (speechRecognition.conversationBuffer) {
        const { error: logError } = await supabase.from('betabot_conversation_log').insert([{
          session_id: sessionId,
          transcript_text: `[SESSION END] Final transcript:\n${speechRecognition.conversationBuffer}`,
          audio_timestamp: sessionTimer,
          speaker_type: 'system'
        }]);

        if (logError) {
          console.warn('⚠️ Could not log final transcript:', logError.message);
          // Continue anyway - this is not critical
        }
      }

      // Update session with final metrics
      const { error } = await supabase.from('betabot_sessions').update({
        is_active: false,
        current_state: 'idle',
        total_questions_generated: generatedQuestions.length,
        total_direct_interactions: directInteractions,
        total_transcript_words: wordCount,
        ended_at: new Date().toISOString()
      }).eq('id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
        throw error;
      }

      console.log(`✅ Session ended successfully:
        - Duration: ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s
        - Questions Generated: ${generatedQuestions.length}
        - Direct Interactions: ${directInteractions}
        - Words Transcribed: ${wordCount}`);

      // Reset state
      setSessionId(null);
      setSessionTimer(0);
      setGeneratedQuestions([]);
      setDirectInteractions(0);
      setChatHistory([]);
      setCurrentAISource(null);

      // Stop speech recognition and clear buffer
      speechRecognition.stopListening();
      speechRecognition.clearBuffer();

      // Reload session history
      loadSessionHistory();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to end session:', errorMessage, error);
      alert(`Failed to end session properly: ${errorMessage}`);
    }
  };

  const loadSessionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('betabot_sessions')
        .select('id, session_name, created_at, total_questions_generated, total_direct_interactions, total_transcript_words')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessionHistory(data || []);
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  const loadBetaBotSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('show_questions')
        .select('id, question_text, context_metadata, created_at')
        .eq('source', 'betabot_conversation_helper')
        .eq('show_on_overlay', false) // Only show pending suggestions
        .order('created_at', { ascending: false})
        .limit(10);

      if (error) throw error;
      setBetaBotSuggestions(data || []);
    } catch (error) {
      console.error('Failed to load BetaBot suggestions:', error);
    }
  };

  const addSuggestionToPopupQueue = async (questionId: string) => {
    try {
      // The question is already in the database with show_on_overlay=false
      // The Popup Queue Manager will display it automatically in its queue
      // We just need to update its position to prioritize it at the top

      // Set position to 0 so it appears first in the queue
      await supabase
        .from('show_questions')
        .update({ position: 0 })
        .eq('id', questionId);

      // Remove from suggestions list (it's now in the main queue)
      setBetaBotSuggestions(prev => prev.filter(s => s.id !== questionId));

      console.log('✅ Question added to Popup Queue Manager');
    } catch (error) {
      console.error('Error adding question to queue:', error);
      // Even if position update fails, still remove from suggestions
      setBetaBotSuggestions(prev => prev.filter(s => s.id !== questionId));
    }
  };

  const dismissSuggestion = async (questionId: string) => {
    try {
      await supabase
        .from('show_questions')
        .delete()
        .eq('id', questionId);

      setBetaBotSuggestions(prev => prev.filter(s => s.id !== questionId));
      console.log('✅ Dismissed suggestion');
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

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

  const handleGenerateQuestions = async () => {
    if (!speechRecognition.conversationBuffer) {
      console.log('No conversation buffer available for question generation');
      return;
    }

    // Check if enough time has passed since last generation (avoid spam)
    const now = Date.now();
    const timeSinceLastGen = now - lastQuestionGenTimeRef.current;
    if (timeSinceLastGen < 30000) { // Minimum 30 seconds between generations
      console.log('Skipping question generation - too soon since last generation');
      return;
    }

    console.log('🤖 Auto-generating questions from conversation buffer...');
    lastQuestionGenTimeRef.current = now;

    try {
      const questions = await betaBotAI.generateQuestions(speechRecognition.conversationBuffer);

      if (questions.length > 0) {
        const newQuestions = questions.map(q => ({
          text: q,
          context: speechRecognition.conversationBuffer.substring(0, 200)
        }));
        setGeneratedQuestions(prev => [...newQuestions, ...prev]);

        // Save to database
        for (const question of questions) {
          await supabase.from('betabot_generated_questions').insert([{
            question_text: question,
            conversation_context: speechRecognition.conversationBuffer,
            session_id: sessionId
          }]);

          // Auto-add to show questions queue for review
          await supabase.from('show_questions').insert([{
            topic: 'BetaBot Suggestion',
            question_text: question,
            source: 'betabot_conversation_helper',
            context_metadata: {
              generated_from: speechRecognition.conversationBuffer.substring(
                Math.max(0, speechRecognition.conversationBuffer.length - 200)
              ),
              generated_at: new Date().toISOString(),
              session_id: sessionId,
              word_count: speechRecognition.conversationBuffer.split(/\s+/).length
            },
            show_on_overlay: false, // Not shown until manually approved
            tts_generated: false,
            position: 9999 // Put at end of queue
          }]);
        }

        console.log(`✅ Generated ${questions.length} questions and added to queue`);

        // Log to conversation log
        if (sessionId) {
          await supabase.from('betabot_conversation_log').insert([{
            session_id: sessionId,
            transcript_text: speechRecognition.conversationBuffer,
            audio_timestamp: Math.floor((now - (sessionTimer * 1000)) / 1000)
          }]);
        }
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    }
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
    <div className="betabot-control-panel">
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
      <div className="mode-selection">
        <div className="mode-header">
          <label>Beta Bot Mode</label>
          <span className="mode-info">Choose how Beta Bot operates</span>
        </div>
        <div className="mode-buttons">
          <button
            className={`mode-btn ${betaBotMode === 'question-generator' ? 'active' : ''}`}
            onClick={() => {
              if (speechRecognition.isListening) {
                alert('Please stop the current session before switching modes');
                return;
              }
              setBetaBotMode('question-generator');
            }}
            disabled={speechRecognition.isListening}
          >
            <div className="mode-icon">📝</div>
            <div className="mode-content">
              <div className="mode-title">Question Generator</div>
              <div className="mode-description">Silent listening - Generates questions from conversation</div>
            </div>
          </button>
          <button
            className={`mode-btn ${betaBotMode === 'co-host' ? 'active' : ''}`}
            onClick={() => {
              if (speechRecognition.isListening) {
                alert('Please stop the current session before switching modes');
                return;
              }
              setBetaBotMode('co-host');
            }}
            disabled={speechRecognition.isListening}
          >
            <div className="mode-icon">🎙️</div>
            <div className="mode-content">
              <div className="mode-title">AI Co-Host</div>
              <div className="mode-description">Interactive - Responds to wake phrases & engages in conversation</div>
            </div>
          </button>
        </div>
      </div>

      {/* TTS Provider Selection - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
      <div className="tts-provider-section">
        <div className="provider-header">
          <label htmlFor="tts-provider">TTS Engine</label>
        </div>
        <select
          id="tts-provider"
          value={ttsProvider}
          onChange={(e) => {
            const newProvider = e.target.value as 'browser' | 'f5tts';
            setTtsProvider(newProvider);
            localStorage.setItem('betabot_tts_provider', newProvider);
            console.log('TTS Provider changed to:', newProvider);
          }}
          className="provider-select"
        >
          <option value="browser">Browser Voices (Built-in)</option>
          <option value="f5tts">F5-TTS (Local Server)</option>
        </select>
        
        {ttsProvider === 'f5tts' && (
          <div className="connection-status-box">
            <div className={`status-indicator ${f5TTS.isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span>{f5TTS.isConnected ? 'Connected to F5-TTS Server' : 'Disconnected - Check server is running'}</span>
            </div>
            {f5TTS.error && (
              <div className="error-message">
                Error: {f5TTS.error}
              </div>
            )}
            {!f5TTS.isConnected && (
              <div className="server-info">
                Expected server: {import.meta.env.VITE_F5_TTS_API_URL || 'http://localhost:8000'}
              </div>
            )}
          </div>
        )}
        
        {showFallbackWarning && (
          <div className="fallback-warning">
            F5-TTS unavailable - using browser TTS as fallback
          </div>
        )}
      </div>
      )}

      {/* Audio Source Selection - Hidden for now, Browser Mic is the recommended solution */}
      {/* OBS Audio mode kept in code for future use cases but hidden from UI */}
      {false && (
      <div className="audio-source-section">
        <div className="section-header">
          <label>🎤 Audio Input Source</label>
        </div>
        <div className="audio-source-buttons">
          <button
            className={`source-btn ${audioSource === 'browser' ? 'active' : ''}`}
            onClick={() => setAudioSource('browser')}
            disabled={speechRecognition.isListening}
          >
            <div className="source-icon">🌐</div>
            <div className="source-content">
              <div className="source-title">Browser Microphone</div>
              <div className="source-description">Direct browser mic access (RECOMMENDED for panel setup)</div>
            </div>
          </button>
          <button
            className={`source-btn ${audioSource === 'obs' ? 'active' : ''}`}
            onClick={() => setAudioSource('obs')}
            disabled={speechRecognition.isListening}
          >
            <div className="source-icon">🎬</div>
            <div className="source-content">
              <div className="source-title">OBS Audio</div>
              <div className="source-description">Capture from OBS Studio (NOT recommended - captures ALL audio)</div>
            </div>
          </button>
        </div>
      </div>
      )}

      {/* Microphone Selection - Only show when Browser mode */}
      {audioSource === 'browser' && (
      <div className="microphone-selection-section">
        <h4>🎤 Select Your Microphone</h4>
        <div className="mic-important-note">
          <strong>⚠️ IMPORTANT:</strong> Select ONLY your personal microphone (NOT BlackHole/Discord audio!)
        </div>
        <select
          value={selectedMicrophoneId}
          onChange={(e) => setSelectedMicrophoneId(e.target.value)}
          className="mic-select"
          disabled={speechRecognition.isListening}
        >
          {availableMicrophones.length === 0 && (
            <option value="">No microphones detected</option>
          )}
          {availableMicrophones.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
        <div className="mic-info-box">
          <div className="info-header">💡 Why Select Your Mic?</div>
          <ul className="info-list">
            <li><strong>BetaBot should only hear YOU</strong> - not Discord panel members</li>
            <li><strong>Avoid BlackHole/Loopback</strong> - these capture ALL system audio</li>
            <li><strong>Choose physical microphone</strong> - e.g., "MacBook Pro Microphone" or USB mic name</li>
            <li><strong>Test first</strong> - Open console (F12) to see audio chunk sizes (should be 100KB+)</li>
          </ul>
        </div>
      </div>
      )}

      {/* OBS Connection Settings - Only show when OBS is selected */}
      {audioSource === 'obs' && (
      <div className="obs-settings-section">
        <h4>🎬 OBS WebSocket Connection</h4>

        <div className="obs-connection-status">
          <div className={`status-indicator ${obsAudio.connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{obsAudio.connected ? 'Connected to OBS' : 'Disconnected'}</span>
          </div>
          {obsAudio.error && (
            <div className="error-message">
              Error: {obsAudio.error}
            </div>
          )}
        </div>

        {!obsAudio.connected ? (
          <div className="obs-connect-form">
            <div className="form-row">
              <label>Host:</label>
              <input
                type="text"
                value={obsHost}
                onChange={(e) => setObsHost(e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div className="form-row">
              <label>WebSocket Port:</label>
              <input
                type="number"
                value={obsPort}
                onChange={(e) => setObsPort(Number(e.target.value))}
                placeholder="4455"
              />
            </div>
            <div className="form-row">
              <label>Password:</label>
              <input
                type="password"
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="form-row">
              <label>Audio WebSocket Port:</label>
              <input
                type="number"
                value={obsAudioPort}
                onChange={(e) => setObsAudioPort(Number(e.target.value))}
                placeholder="4456"
              />
            </div>
            <button
              className="btn-obs-connect"
              onClick={obsAudio.connect}
            >
              Connect to OBS
            </button>
          </div>
        ) : (
          <div className="obs-connected-controls">
            <div className="audio-source-select">
              <label>Select Audio Source:</label>
              <select
                value={obsAudio.selectedSource || ''}
                onChange={(e) => {
                  const sourceName = e.target.value;
                  if (sourceName) {
                    obsAudio.startAudioCapture(sourceName, obsAudioPort);
                  }
                }}
                disabled={!obsAudio.audioSources.length}
              >
                <option value="">-- Select Audio Input --</option>
                {obsAudio.audioSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-obs-disconnect"
              onClick={obsAudio.disconnect}
            >
              Disconnect from OBS
            </button>
          </div>
        )}

        <div className="obs-info-box">
          <div className="info-header">ℹ️ OBS WebSocket Setup</div>
          <ul className="info-list">
            <li><strong>Step 1:</strong> Install OBS Studio v28+ (WebSocket 5.0 built-in)</li>
            <li><strong>Step 2:</strong> Tools → WebSocket Server Settings → Enable</li>
            <li><strong>Step 3:</strong> Install <code>obs-audio-to-websocket</code> plugin</li>
            <li><strong>Step 4:</strong> Configure audio source and port in plugin settings</li>
            <li><strong>Why OBS?</strong> Isolates mic from stream audio, prevents feedback, more reliable</li>
          </ul>
        </div>
      </div>
      )}

      {/* Voice Selection - Only show for browser TTS in Co-Host mode */}
      {betaBotMode === 'co-host' && ttsProvider === 'browser' && (
      <div className="voice-section">
        <div className="voice-header">
          <label htmlFor="voice-select">🎤 Voice Selection</label>
          <button
            className="btn-preview"
            onClick={handlePreviewVoice}
            disabled={!browserTTS.selectedVoice || browserTTS.isSpeaking}
          >
            ▶️ Preview
          </button>
        </div>
        <select
          id="voice-select"
          value={browserTTS.selectedVoice?.name || ''}
          onChange={(e) => {
            const voice = browserTTS.voices.find(v => v.name === e.target.value);
            if (voice) browserTTS.setSelectedVoice(voice);
          }}
          className="voice-select"
        >
          {browserTTS.voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <div className="voice-tip">
          💡 <strong>Tip:</strong> For best quality, choose voices starting with "Microsoft" or "Google". Your selection is saved automatically.
        </div>
        <div className="voice-info-box">
          <div className="info-header">🔊 Voice Quality Information</div>
          <ul className="info-list">
            <li><strong>Current:</strong> Using browser built-in voices (free, basic quality)</li>
            <li><strong>Quality varies</strong> by operating system and installed voices</li>
            <li><strong>Windows:</strong> Install additional voices via Settings → Time & Language → Speech</li>
            <li><strong>macOS:</strong> System Preferences → Accessibility → Spoken Content → System Voice</li>
            <li><strong>For Premium Quality:</strong> Microsoft Azure TTS API can be integrated (requires API key)</li>
          </ul>
        </div>
      </div>
      )}

      {/* Text Chat Input - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && (
      <div className="text-chat-section">
        <h4>💬 Text Chat</h4>
        <div className="chat-input-group">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextChatSubmit()}
            placeholder="Type a question for Beta Bot..."
            className="chat-input"
            disabled={!sessionId || betaBotAI.isProcessing || tts.isSpeaking}
          />
          <button
            className="btn-send"
            onClick={handleTextChatSubmit}
            disabled={!sessionId || !textInput.trim() || betaBotAI.isProcessing || tts.isSpeaking}
          >
            Send ➤
          </button>
        </div>
        {currentAISource && (
          <div className={`ai-indicator ${currentAISource}`}>
            {currentAISource === 'gpt4' ? '🟢 Using GPT-4' : '🔴 Using Perplexity (Real-time)'}
          </div>
        )}
      </div>
      )}

      {/* Chat History - Only show in Co-Host mode */}
      {betaBotMode === 'co-host' && chatHistory.length > 0 && (
        <div className="chat-history">
          <h4>Recent Conversations</h4>
          <div className="chat-list">
            {chatHistory.map((chat, index) => (
              <div key={index} className="chat-item">
                <div className="chat-question">
                  <span className="chat-label">Q:</span>
                  <span>{chat.question}</span>
                  <span className={`chat-ai-badge ${chat.aiSource}`}>
                    {chat.aiSource === 'gpt4' ? 'GPT-4' : 'Perplexity'}
                  </span>
                </div>
                <div className="chat-answer">
                  <span className="chat-label">A:</span>
                  <span>{chat.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="controls-section">
        <button
          className={`btn-control ${speechRecognition.isListening ? 'active' : ''}`}
          onClick={() => {
            if (speechRecognition.isListening) {
              endSession();
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
                createSession();
              }
            }
          }}
          disabled={audioSource === 'obs' && (!obsAudio.connected || !obsAudio.selectedSource)}
        >
          {speechRecognition.isListening ? '⏹ End Session' : '▶️ Start Session'}
        </button>

        <button
          className="btn-control btn-generate"
          onClick={handleGenerateQuestions}
          disabled={!speechRecognition.conversationBuffer || betaBotAI.isProcessing}
        >
          ⚡ Generate Now
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

      {/* Auto-Generation Settings */}
      <div className="auto-generate-section">
        <div className="auto-header">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              disabled={!sessionId}
            />
            <span>Auto-Generate Questions</span>
          </label>
          <select
            value={autoGenerateInterval}
            onChange={(e) => setAutoGenerateInterval(Number(e.target.value))}
            disabled={!autoGenerate}
            className="interval-select"
          >
            <option value={120}>Every 2 min</option>
            <option value={300}>Every 5 min</option>
            <option value={600}>Every 10 min</option>
          </select>
        </div>
      </div>

      {/* Session Info */}
      {sessionId && (
        <div className="session-info">
          <div className="info-item">
            <span className="label">Session Time</span>
            <span className="value">{formatTime(sessionTimer)}</span>
          </div>
          <div className="info-item">
            <span className="label">Questions</span>
            <span className="value">{generatedQuestions.length}</span>
          </div>
          <div className="info-item">
            <span className="label">Interactions</span>
            <span className="value">{directInteractions}</span>
          </div>
          <div className="info-item">
            <span className="label">Words</span>
            <span className="value">{speechRecognition.conversationBuffer.split(/\s+/).filter(w => w.length > 0).length}</span>
          </div>
        </div>
      )}

      {/* Auto-Generation Status */}
      {sessionId && speechRecognition.isListening && (
        <div className="auto-gen-status">
          <div className="status-header">
            <span className="status-icon">🤖</span>
            <span className="status-text">Auto-Generation Active</span>
            <span className={`status-indicator ${speechRecognition.conversationBuffer.split(' ').length >= 50 ? 'ready' : 'waiting'}`}>
              {speechRecognition.conversationBuffer.split(' ').length >= 50 ? 'Ready' : 'Building Context'}
            </span>
          </div>
          <div className="status-detail">
            Next generation in: {autoQuestionGenInterval}s intervals
            {speechRecognition.conversationBuffer.split(' ').length < 50 && (
              <span className="words-needed"> • Need {50 - speechRecognition.conversationBuffer.split(' ').length} more words</span>
            )}
          </div>
        </div>
      )}

      {/* API Health Status */}
      <div className="api-health">
        <h4>API Status</h4>
        <div className="health-grid">
          <div className={`health-item ${betaBotAI.apiHealth.gemini === 'healthy' ? 'healthy' : betaBotAI.apiHealth.gemini === 'degraded' ? 'warning' : 'error'}`}>
            <span>Gemini</span>
            <span className="health-dot" />
          </div>
          <div className={`health-item ${betaBotAI.apiHealth.openai === 'healthy' ? 'healthy' : betaBotAI.apiHealth.openai === 'degraded' ? 'warning' : 'error'}`}>
            <span>OpenAI</span>
            <span className="health-dot" />
          </div>
          <div className={`health-item ${speechRecognition.whisperAvailable ? 'healthy' : 'warning'}`}>
            <span>Whisper</span>
            <span className="health-dot" />
          </div>
        </div>
      </div>

      {/* Live Transcript */}
      {speechRecognition.transcript && (
        <div className="transcript-section">
          <h4>Latest Transcript</h4>
          <div className="transcript-box">
            {speechRecognition.transcript}
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="history-section">
        <div className="history-header">
          <h4>Session History</h4>
          <button 
            className="btn-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '▼' : '▶'}
          </button>
        </div>
        {showHistory && (
          <div className="history-list">
            {sessionHistory.length === 0 ? (
              <p className="no-history">No previous sessions</p>
            ) : (
              sessionHistory.map((session) => (
                <div key={session.id} className="history-item">
                  <div className="history-name">{session.session_name}</div>
                  <div className="history-stats">
                    <span>📝 {session.total_questions_generated || 0}</span>
                    <span>💬 {session.total_direct_interactions || 0}</span>
                    <span>📊 {session.total_transcript_words || 0} words</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* BetaBot Suggestions - Questions Generated from Conversation */}
      {betaBotSuggestions.length > 0 && (
        <div className="betabot-suggestions">
          <div className="suggestions-header">
            <h4>🤖 BetaBot Suggestions</h4>
            <span className="suggestion-count">{betaBotSuggestions.length} pending</span>
          </div>
          <div className="suggestions-list">
            {betaBotSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                <div className="suggestion-content">
                  <p className="suggestion-text">{suggestion.question_text}</p>
                  {suggestion.context_metadata?.generated_from && (
                    <p className="suggestion-context">
                      Context: "{suggestion.context_metadata.generated_from.substring(0, 80)}..."
                    </p>
                  )}
                  <p className="suggestion-meta">
                    Generated {new Date(suggestion.created_at).toLocaleTimeString()} •
                    {suggestion.context_metadata?.word_count || 0} words analyzed
                  </p>
                </div>
                <div className="suggestion-actions">
                  <button
                    className="btn-add-queue"
                    onClick={() => addSuggestionToPopupQueue(suggestion.id)}
                    title="Add to Popup Queue"
                  >
                    ➕ Add to Queue
                  </button>
                  <button
                    className="btn-dismiss"
                    onClick={() => dismissSuggestion(suggestion.id)}
                    title="Dismiss suggestion"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .betabot-control-panel {
          background: rgba(17, 24, 39, 0.95);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
        }

        .panel-header h3 {
          color: #f3f4f6;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 20px;
          font-size: 12px;
          color: #d1d5db;
        }

        .mode-badge {
          background: rgba(250, 204, 21, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          color: #facc15;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .status-dot.idle {
          background: #9ca3af;
        }

        .status-dot.listening {
          background: #facc15;
        }

        .status-dot.speaking {
          background: #ef4444;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mode Selection Styles */
        .mode-selection {
          margin-bottom: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .mode-header {
          margin-bottom: 12px;
        }

        .mode-header label {
          color: #f3f4f6;
          font-size: 14px;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .mode-info {
          color: #9ca3af;
          font-size: 11px;
          display: block;
        }

        .mode-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .mode-btn {
          background: rgba(17, 24, 39, 0.8);
          border: 2px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .mode-btn:hover:not(:disabled) {
          border-color: rgba(250, 204, 21, 0.5);
          background: rgba(17, 24, 39, 0.95);
          transform: translateY(-2px);
        }

        .mode-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mode-btn.active {
          border-color: #facc15;
          background: rgba(250, 204, 21, 0.1);
        }

        .mode-icon {
          font-size: 24px;
          line-height: 1;
        }

        .mode-content {
          flex: 1;
        }

        .mode-title {
          color: #f3f4f6;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .mode-description {
          color: #9ca3af;
          font-size: 11px;
          line-height: 1.4;
        }

        .mode-btn.active .mode-title {
          color: #facc15;
        }

        .controls-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn-control {
          padding: 10px 16px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border: 2px solid #7f1d1d;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-control:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .btn-control:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-control.active {
          background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
          border-color: #d97706;
        }

        .btn-generate {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #047857;
        }

        .btn-export {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-color: #1d4ed8;
        }

        .btn-test {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-color: #6d28d9;
        }

        .auto-generate-section {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .auto-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d1d5db;
          font-size: 13px;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .interval-select {
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 6px;
          color: white;
          font-size: 12px;
          cursor: pointer;
        }

        .interval-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .session-info {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .info-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item .label {
          font-size: 10px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item .value {
          font-size: 18px;
          color: #facc15;
          font-weight: 600;
        }

        .api-health {
          margin-bottom: 20px;
        }

        .api-health h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0 0 10px 0;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .health-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          font-size: 12px;
        }

        .health-item.healthy {
          color: #10b981;
        }

        .health-item.warning {
          color: #f59e0b;
        }

        .health-item.error {
          color: #ef4444;
        }

        .health-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .transcript-section {
          margin-bottom: 20px;
        }

        .transcript-section h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0 0 10px 0;
        }

        .transcript-box {
          background: rgba(0, 0, 0, 0.4);
          padding: 12px;
          border-radius: 6px;
          max-height: 100px;
          overflow-y: auto;
          color: #d1d5db;
          font-size: 13px;
          line-height: 1.5;
        }

        .history-section {
          margin-bottom: 20px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .history-header h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0;
        }

        .btn-toggle {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-toggle:hover {
          color: #facc15;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .no-history {
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          padding: 20px;
        }

        .history-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #6b7280;
        }

        .history-name {
          color: #d1d5db;
          font-size: 13px;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .history-stats {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #9ca3af;
        }

        .betabot-suggestions {
          margin-top: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          border: 1px solid rgba(250, 204, 21, 0.3);
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .suggestions-header h4 {
          color: #facc15;
          font-size: 14px;
          margin: 0;
          font-weight: 600;
        }

        .suggestion-count {
          background: rgba(250, 204, 21, 0.2);
          color: #facc15;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .suggestion-item {
          background: rgba(17, 24, 39, 0.8);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(75, 85, 99, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .suggestion-item:hover {
          border-color: rgba(250, 204, 21, 0.5);
          background: rgba(17, 24, 39, 0.95);
        }

        .suggestion-content {
          flex: 1;
        }

        .suggestion-text {
          color: #f3f4f6;
          font-size: 13px;
          margin: 0 0 8px 0;
          line-height: 1.5;
          font-weight: 500;
        }

        .suggestion-context {
          color: #9ca3af;
          font-size: 11px;
          margin: 0 0 6px 0;
          font-style: italic;
          line-height: 1.4;
        }

        .suggestion-meta {
          color: #6b7280;
          font-size: 10px;
          margin: 0;
        }

        .suggestion-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .btn-add-queue {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .btn-add-queue:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-dismiss {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-dismiss:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .question-item p {
          margin: 0;
          color: #d1d5db;
          font-size: 13px;
        }

        /* TTS Provider Selection Styles */
        .tts-provider-section {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .provider-header {
          margin-bottom: 10px;
        }

        .provider-header label {
          color: #86efac;
          font-size: 14px;
          font-weight: 600;
        }

        .provider-select {
          width: 100%;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(34, 197, 94, 0.5);
          border-radius: 6px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .provider-select option {
          background: #1f2937;
          color: white;
        }

        .connection-status-box {
          margin-top: 10px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .status-indicator.connected {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .status-indicator.disconnected {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .status-indicator .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s ease-in-out infinite;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          padding: 6px 10px;
          border-radius: 4px;
          color: #fca5a5;
          font-size: 11px;
          margin-bottom: 6px;
        }

        .server-info {
          background: rgba(59, 130, 246, 0.1);
          border-left: 3px solid #3b82f6;
          padding: 6px 10px;
          border-radius: 4px;
          color: #93c5fd;
          font-size: 11px;
        }

        .fallback-warning {
          background: rgba(251, 146, 60, 0.2);
          border: 1px solid rgba(251, 146, 60, 0.3);
          padding: 8px 10px;
          border-radius: 6px;
          color: #fdba74;
          font-size: 12px;
          margin-top: 10px;
          animation: fadeIn 0.3s ease;
        }

        /* Voice Selection Styles */
        .voice-section {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .voice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .voice-header label {
          color: #e9d5ff;
          font-size: 14px;
          font-weight: 600;
        }

        .btn-preview {
          padding: 6px 12px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: 1px solid #6d28d9;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-preview:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
        }

        .btn-preview:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-select {
          width: 100%;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(139, 92, 246, 0.5);
          border-radius: 6px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 10px;
        }

        .voice-select option {
          background: #1f2937;
          color: white;
        }

        .voice-tip {
          background: rgba(250, 204, 21, 0.1);
          border-left: 3px solid #facc15;
          padding: 8px 10px;
          border-radius: 4px;
          color: #fef3c7;
          font-size: 11px;
          line-height: 1.4;
        }

        .voice-tip strong {
          color: #facc15;
        }

        .voice-info-box {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
        }

        .voice-info-box .info-header {
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .voice-info-box .info-list {
          margin: 0;
          padding-left: 18px;
          color: #d1d5db;
          font-size: 11px;
          line-height: 1.6;
        }

        .voice-info-box .info-list li {
          margin-bottom: 4px;
        }

        .voice-info-box .info-list strong {
          color: #60a5fa;
        }

        /* Text Chat Styles */
        .text-chat-section {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .text-chat-section h4 {
          color: #bfdbfe;
          font-size: 14px;
          margin: 0 0 10px 0;
          font-weight: 600;
        }

        .chat-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .chat-input {
          flex: 1;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.5);
          border-radius: 6px;
          color: white;
          font-size: 13px;
        }

        .chat-input::placeholder {
          color: #9ca3af;
        }

        .chat-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .chat-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-send {
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 1px solid #1d4ed8;
          border-radius: 6px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-send:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .btn-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-indicator {
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        .ai-indicator.gpt4 {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .ai-indicator.perplexity {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Chat History Styles */
        .chat-history {
          margin-bottom: 20px;
        }

        .chat-history h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0 0 10px 0;
        }

        .chat-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 300px;
          overflow-y: auto;
        }

        .chat-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .chat-question {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 500;
        }

        .chat-answer {
          display: flex;
          gap: 8px;
          color: #d1d5db;
          font-size: 12px;
          line-height: 1.5;
        }

        .chat-label {
          font-weight: 700;
          color: #facc15;
          min-width: 20px;
        }

        .chat-ai-badge {
          margin-left: auto;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }

        .chat-ai-badge.gpt4 {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .chat-ai-badge.perplexity {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Auto-Generation Status Styles */
        .auto-gen-status {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 12px 15px;
          margin-bottom: 20px;
        }

        .auto-gen-status .status-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .auto-gen-status .status-icon {
          font-size: 18px;
        }

        .auto-gen-status .status-text {
          color: #10b981;
          font-size: 14px;
          font-weight: 600;
          flex: 1;
        }

        .auto-gen-status .status-indicator {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auto-gen-status .status-indicator.ready {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .auto-gen-status .status-indicator.waiting {
          background: rgba(251, 146, 60, 0.2);
          color: #fb923c;
        }

        .auto-gen-status .status-detail {
          color: #9ca3af;
          font-size: 12px;
          padding-left: 28px;
        }

        .auto-gen-status .words-needed {
          color: #fb923c;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
