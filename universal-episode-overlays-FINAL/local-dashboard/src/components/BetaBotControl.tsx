import React, { useState, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { supabase } from '../lib/supabase';

interface BetaBotControlProps {
  className?: string;
}

const BetaBotControl: React.FC<BetaBotControlProps> = ({ className = '' }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [mode, setMode] = useState<'co-host' | 'question-generator'>('co-host');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get OpenAI API key from environment
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Speech recognition hook
  const {
    isListening,
    isRecording,
    currentStatus,
    error: speechError,
    transcript,
    timeRemaining,
    startListening,
    stopListening,
    clearError,
    clearTranscript
  } = useSpeechRecognition({
    apiKey,
    onTranscript: handleTranscriptSave,
    onWakePhraseDetected: handleWakePhraseDetected
  });

  /**
   * Save transcript to database
   */
  async function handleTranscriptSave(text: string) {
    try {
      console.log('💾 Saving transcript to database:', text);

      const { data, error } = await supabase
        .from('betabot_conversation_log')
        .insert({
          conversation_buffer: text,
          transcript_text: text,
          metadata: {
            source: 'speech_recognition',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Transcript saved successfully');
      
      // Add to UI
      setMessages(prev => [...prev, {
        text,
        isUser: true,
        timestamp: new Date()
      }]);

    } catch (error: any) {
      console.error('❌ Failed to save transcript:', error);
    }
  }

  /**
   * Handle wake phrase detection
   */
  function handleWakePhraseDetected(event: { phrase: string; context: string }) {
    console.log('🎙️ Wake phrase detected:', event);

    if (mode !== 'co-host') {
      console.log('⏭️ Wake phrase ignored (not in co-host mode)');
      return;
    }

    if (event.context) {
      // Process the question after wake phrase
      handleBetaBotQuestion(event.context);
    } else {
      // Wake phrase without context - waiting for question
      setMessages(prev => [...prev, {
        text: `👂 Listening... Say your question after "Beta Bot"`,
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }

  /**
   * Process BetaBot question via API
   */
  async function handleBetaBotQuestion(question: string) {
    if (!question.trim()) return;

    setIsProcessing(true);
    setMessages(prev => [...prev, {
      text: `❓ Question: "${question}"`,
      isUser: true,
      timestamp: new Date()
    }]);

    try {
      // Call backend API to get BetaBot response
      const response = await fetch('/api/betabot/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          mode,
          sessionActive
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        text: `🤖 ${data.response}`,
        isUser: false,
        timestamp: new Date()
      }]);

      // TODO: Play TTS audio response
      if (data.audioUrl) {
        playAudioResponse(data.audioUrl);
      }

    } catch (error: any) {
      console.error('❌ BetaBot question failed:', error);
      setMessages(prev => [...prev, {
        text: `❌ Error: ${error.message}`,
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Play audio response from TTS
   */
  function playAudioResponse(audioUrl: string) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Audio playback failed:', error);
    });
  }

  /**
   * Handle text input submission
   */
  const handleTextSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const question = textInput.trim();
    setTextInput('');
    await handleBetaBotQuestion(question);
  }, [textInput, isProcessing]);

  /**
   * Start session
   */
  const handleStartSession = useCallback(() => {
    setSessionActive(true);
    setMessages(prev => [...prev, {
      text: '📡 Session started - BetaBot is ready',
      isUser: false,
      timestamp: new Date()
    }]);
  }, []);

  /**
   * Stop session
   */
  const handleStopSession = useCallback(() => {
    setSessionActive(false);
    stopListening();
    setMessages(prev => [...prev, {
      text: '⏹️ Session stopped',
      isUser: false,
      timestamp: new Date()
    }]);
  }, [stopListening]);

  /**
   * Toggle listening
   */
  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * Test TTS
   */
  const handleTestTTS = useCallback(async () => {
    try {
      const response = await fetch('/api/betabot/tts-test');
      const data = await response.json();
      
      if (data.audioUrl) {
        playAudioResponse(data.audioUrl);
      }
    } catch (error) {
      console.error('TTS test failed:', error);
    }
  }, []);

  /**
   * Format time remaining
   */
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get status indicator color
   */
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'listening': return 'text-blue-400';
      case 'recording': return 'text-red-400';
      case 'processing': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  /**
   * Get status indicator text
   */
  const getStatusText = () => {
    switch (currentStatus) {
      case 'listening': return '🎤 Listening...';
      case 'recording': return `🔴 Recording (${formatTime(timeRemaining)})`;
      case 'processing': return '⏳ Processing...';
      default: return '⏸️ Idle';
    }
  };

  return (
    <div className={`bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-white">BetaBot Control Panel</h2>

      {/* Session Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Session Control</h3>
        <div className="flex gap-3">
          <button
            onClick={handleStartSession}
            disabled={sessionActive}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              sessionActive
                ? 'bg-green-600/50 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            ✅ Start Session
          </button>
          <button
            onClick={handleStopSession}
            disabled={!sessionActive}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              !sessionActive
                ? 'bg-red-600/50 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            ⏹️ Stop Session
          </button>
        </div>
        <div className="mt-2 text-sm">
          <span className={sessionActive ? 'text-green-400' : 'text-gray-400'}>
            Status: {sessionActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Mode</h3>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'co-host' | 'question-generator')}
          className="bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
        >
          <option value="co-host">🎙️ Co-Host Mode (Wake Phrase Detection)</option>
          <option value="question-generator">❓ Question Generator Mode</option>
        </select>
      </div>

      {/* Speech Recognition Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Speech Recognition</h3>
        <div className="flex gap-3 mb-3">
          <button
            onClick={handleToggleListening}
            disabled={!sessionActive}
            className={`px-6 py-3 rounded font-bold text-lg transition-all ${
              !sessionActive
                ? 'bg-gray-600/50 cursor-not-allowed'
                : isListening
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
          </button>
          <button
            onClick={handleTestTTS}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
          >
            🔊 Test TTS
          </button>
        </div>

        {/* Status Display */}
        <div className="mb-3">
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {speechError && (
            <div className="mt-2 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
              ❌ {speechError}
              <button
                onClick={clearError}
                className="ml-2 text-red-300 hover:text-red-100 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Visual Indicators */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Listening</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Recording</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Processing</span>
          </div>
        </div>
      </div>

      {/* Text Chat Input (Alternative to speech) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Text Chat (Alternative)</h3>
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded px-3 py-2 text-white"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            {isProcessing ? '⏳' : 'Send'}
          </button>
        </form>
        <p className="mt-2 text-sm text-gray-400">
          💡 Use this if speech recognition isn't working. BetaBot will still respond via text and TTS.
        </p>
      </div>

      {/* Current Transcript */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Current Transcript</h3>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded p-3 text-gray-300">
            {transcript}
          </div>
          <button
            onClick={clearTranscript}
            className="mt-2 text-sm text-gray-400 hover:text-gray-300 underline"
          >
            Clear transcript
          </button>
        </div>
      )}

      {/* Conversation Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-white">Conversation Log</h3>
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded p-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No messages yet. Start a session and ask BetaBot a question!
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded ${
                    msg.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a1a1a] border border-[#3a3a3a] text-gray-300'
                  }`}>
                    <div className="text-sm opacity-70 mb-1">
                      {msg.isUser ? '👤 You' : '🤖 BetaBot'} • {msg.timestamp.toLocaleTimeString()}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded">
        <h4 className="font-semibold mb-2 text-blue-400">📋 How to Use</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Click <strong>"Start Session"</strong> to activate BetaBot</li>
          <li>Click <strong>"Start Listening"</strong> to enable speech recognition</li>
          <li>Say <strong>"Hey Beta Bot"</strong> or <strong>"Beta Bot"</strong> followed by your question</li>
          <li>Example: <em>"Hey Beta Bot, what's the weather today?"</em></li>
          <li>Or use the text chat input as an alternative</li>
        </ol>
      </div>
    </div>
  );
};

export default BetaBotControl;
