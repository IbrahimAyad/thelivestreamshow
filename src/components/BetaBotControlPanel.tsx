import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition, WakeDetectionEvent, VisualSearchEvent } from '../hooks/useSpeechRecognition';
import { useBetaBotAI } from '../hooks/useBetaBotAI';
import { useTTS } from '../hooks/useTTS';
import { useF5TTS } from '../hooks/useF5TTS';
import { usePerplexitySearch } from '../hooks/usePerplexitySearch';
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

  // Initialize hooks first (without callbacks)
  const betaBotAI = useBetaBotAI();
  const browserTTS = useTTS();
  const f5TTS = useF5TTS();
  const perplexity = usePerplexitySearch();
  
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
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [{
            role: 'user',
            content: question
          }],
          temperature: 0.2,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('Perplexity API request failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'I couldn\'t find an answer to that question.';
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  };

  // Unified question handler for both wake phrase and text chat
  const handleQuestion = useCallback(async (question: string, source: 'wake_phrase' | 'text_chat') => {
    if (!question || question.length < 3) {
      console.log('Question too short, skipping');
      return;
    }

    try {
      // Log interaction
      if (sessionId) {
        const { error } = await supabase.from('betabot_interactions').insert([{
          session_id: sessionId,
          interaction_type: source,
          user_input: question,
          timestamp: new Date().toISOString()
        }]);

        if (error) console.error('Error logging interaction:', error);
        setDirectInteractions(prev => prev + 1);
      }

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
      
      if (response) {
        // Update session state to 'speaking'
        if (sessionId) {
          await supabase.from('betabot_sessions').update({
            current_state: 'speaking'
          }).eq('id', sessionId);
        }

        // Speak the response with fallback logic
        try {
          await tts.speak(response);
        } catch (ttsError) {
          console.error('TTS failed, falling back to browser TTS:', ttsError);
          if (ttsProvider === 'f5tts') {
            setShowFallbackWarning(true);
            setTimeout(() => setShowFallbackWarning(false), 5000);
            await browserTTS.speak(response);
          }
        }

        // Add to chat history
        setChatHistory(prev => [{question, answer: response, aiSource}, ...prev].slice(0, 5));

        // Log conversation
        if (sessionId) {
          await supabase.from('betabot_conversation_log').insert([{
            session_id: sessionId,
            user_message: question,
            bot_response: response,
            conversation_context: conversationBuffer
          }]);

          // Update session state back to 'listening' after speaking
          await supabase.from('betabot_sessions').update({
            current_state: 'listening',
            total_direct_interactions: directInteractions + 1
          }).eq('id', sessionId);
        }

        // Clear AI source indicator after 2 seconds
        setTimeout(() => setCurrentAISource(null), 2000);
      }
    } catch (error) {
      console.error('Error handling question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      tts.speak(`Sorry, I encountered an error: ${errorMessage}`);
      setCurrentAISource(null);
    }
  }, [sessionId, directInteractions, betaBotAI, tts, perplexity]);

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

      // Perform search
      const result = await perplexity.search(event.query, 'images');
      
      if (result.urls.length > 0) {
        // Save to database and show on broadcast
        const { error } = await supabase.from('betabot_visual_content').insert([{
          search_query: event.query,
          content_type: 'images',
          content_urls: result.urls,
          session_id: sessionId,
          is_visible: true
        }]);

        if (error) {
          console.error('Error saving visual content:', error);
          throw error;
        }

        // Speak confirmation
        tts.speak(`Showing results for ${event.query}`);
        console.log('✅ Visual search results displayed');
      } else {
        tts.speak(`Sorry, I couldn't find any results for ${event.query}`);
      }
    } catch (error) {
      console.error('Error handling visual search:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      tts.speak(`Sorry, search failed: ${errorMessage}`);
    }
  }, [sessionId, perplexity, tts]);

  // Initialize speech recognition with callbacks NOW
  const speechRecognition = useSpeechRecognition({
    onWakePhraseDetected: handleWakePhraseDetected,
    onVisualSearchDetected: handleVisualSearchDetected
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

  // Auto-generate questions timer
  useEffect(() => {
    if (!autoGenerate || !sessionId || !speechRecognition.conversationBuffer) return;

    const interval = setInterval(async () => {
      console.log('⏰ Auto-generating questions based on conversation...');
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

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory();
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
      // Calculate word count from conversation buffer
      const wordCount = speechRecognition.conversationBuffer.split(/\s+/).filter(w => w.length > 0).length;

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

      setSessionId(null);
      setSessionTimer(0);
      speechRecognition.stopListening();
      speechRecognition.clearBuffer();
      loadSessionHistory();
      console.log('✅ Session ended successfully');
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
    if (!speechRecognition.conversationBuffer) return;

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

        // Auto-add to show questions queue
        await supabase.from('show_questions').insert([{
          question_text: question,
          source: 'betabot',
          context_metadata: { conversation_context: speechRecognition.conversationBuffer }
        }]);
      }
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
        <h3>🤖 Beta Bot AI Co-Host</h3>
        <div className="status-indicator">
          <div className={`status-dot ${speechRecognition.isListening ? 'listening' : tts.isSpeaking ? 'speaking' : 'idle'}`} />
          <span>{speechRecognition.isListening ? 'Listening' : tts.isSpeaking ? 'Speaking' : 'Ready'}</span>
          {speechRecognition.transcriptionMode !== 'idle' && (
            <span className="mode-badge">{speechRecognition.transcriptionMode === 'whisper' ? '🎯 Whisper' : '🌐 Browser'}</span>
          )}
        </div>
      </div>

      {/* TTS Provider Selection */}
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

      {/* Voice Selection - Only show for browser TTS */}
      {ttsProvider === 'browser' && (
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

      {/* Text Chat Input */}
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

      {/* Chat History */}
      {chatHistory.length > 0 && (
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
              speechRecognition.startListening();
            }
          }}
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

      {/* Generated Questions Preview */}
      {generatedQuestions.length > 0 && (
        <div className="questions-preview">
          <h4>Recent Generated Questions</h4>
          <div className="questions-list">
            {generatedQuestions.slice(0, 5).map((q, index) => (
              <div key={index} className="question-item">
                <p>{q.text}</p>
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

        .questions-preview h4 {
          color: #f3f4f6;
          font-size: 14px;
          margin: 0 0 10px 0;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .question-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #facc15;
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
      `}</style>
    </div>
  );
}
