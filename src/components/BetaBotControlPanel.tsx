import React, { useState, useCallback, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { supabase } from '../lib/supabase';

interface BetaBotControlProps {
  className?: string;
}

export function BetaBotControlPanel({ className = '' }: BetaBotControlProps) {
  const [sessionActive, setSessionActive] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualListening, setIsManualListening] = useState(false);
  const manualListeningTimeout = useRef<NodeJS.Timeout | null>(null);

  // Speech recognition hook - MANUAL MODE ONLY
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onWakePhraseDetected: handleWakePhraseDetected,
  });

  /**
   * Handle wake phrase detection in manual mode
   */
  function handleWakePhraseDetected(event: { phrase: string; context: string }) {
    console.log('🎙️ Manual wake phrase detected:', event);

    if (event.context) {
      // Process the question after wake phrase
      handleBetaBotQuestion(event.context);
    } else {
      // Wake phrase without context - extend listening time
      extendManualListening();
    }
  }

  /**
   * Start manual listening session (30 seconds max)
   */
  const handleStartManualListening = useCallback(async () => {
    if (!sessionActive) {
      setMessages(prev => [...prev, {
        text: '❌ Please start a session first',
        isUser: false,
        timestamp: new Date()
      }]);
      return;
    }

    setIsManualListening(true);
    await startListening();
    
    setMessages(prev => [...prev, {
      text: '🎤 Manual listening activated (30 seconds). Say "Beta Bot" + your question.',
      isUser: false,
      timestamp: new Date()
    }]);

    // Auto-stop after 30 seconds
    manualListeningTimeout.current = setTimeout(() => {
      handleStopManualListening();
    }, 30000);
  }, [sessionActive, startListening]);

  /**
   * Stop manual listening
   */
  const handleStopManualListening = useCallback(() => {
    setIsManualListening(false);
    stopListening();
    
    if (manualListeningTimeout.current) {
      clearTimeout(manualListeningTimeout.current);
      manualListeningTimeout.current = null;
    }

    setMessages(prev => [...prev, {
      text: '⏹️ Manual listening stopped',
      isUser: false,
      timestamp: new Date()
    }]);
  }, [stopListening]);

  /**
   * Extend manual listening (when wake phrase detected but no context)
   */
  const extendManualListening = useCallback(() => {
    if (manualListeningTimeout.current) {
      clearTimeout(manualListeningTimeout.current);
    }

    setMessages(prev => [...prev, {
      text: '👂 Wake phrase detected! Extended listening for 15 seconds...',
      isUser: false,
      timestamp: new Date()
    }]);

    // Extend for another 15 seconds
    manualListeningTimeout.current = setTimeout(() => {
      handleStopManualListening();
    }, 15000);
  }, [handleStopManualListening]);

  /**
   * Process BetaBot question
   */
  async function handleBetaBotQuestion(question: string) {
    if (!question.trim()) return;

    // Auto-stop listening when question received
    if (isManualListening) {
      handleStopManualListening();
    }

    setIsProcessing(true);
    setMessages(prev => [...prev, {
      text: `❓ Question: "${question}"`,
      isUser: true,
      timestamp: new Date()
    }]);

    try {
      // Placeholder response - integrate with your actual BetaBot API
      const response = `This is a placeholder response to: "${question}"`;
      
      setMessages(prev => [...prev, {
        text: `🤖 ${response}`,
        isUser: false,
        timestamp: new Date()
      }]);

      // Save to database
      await supabase.from('betabot_conversation_log').insert({
        conversation_buffer: `User: ${question}\nBetaBot: ${response}`,
        transcript_text: question,
        metadata: {
          source: 'manual_mode',
          timestamp: new Date().toISOString()
        }
      });

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
      text: '📡 Session started - BetaBot ready for manual activation',
      isUser: false,
      timestamp: new Date()
    }]);
  }, []);

  /**
   * Stop session
   */
  const handleStopSession = useCallback(() => {
    setSessionActive(false);
    if (isManualListening) {
      handleStopManualListening();
    }
    setMessages(prev => [...prev, {
      text: '⏹️ Session stopped',
      isUser: false,
      timestamp: new Date()
    }]);
  }, [isManualListening, handleStopManualListening]);

  return (
    <div className={`bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-white">BetaBot Manual Control Panel</h2>

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
            Status: {sessionActive ? 'Active (Manual Mode)' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Manual Activation Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Manual Speech Recognition</h3>
        
        {/* Big Manual Activation Button */}
        <div className="mb-4">
          <button
            onClick={isManualListening ? handleStopManualListening : handleStartManualListening}
            disabled={!sessionActive}
            className={`w-full px-8 py-6 rounded-lg font-bold text-xl transition-all ${
              !sessionActive
                ? 'bg-gray-600/50 cursor-not-allowed'
                : isManualListening
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/50'
            } text-white`}
          >
            {!sessionActive
              ? '⚠️ Start Session First'
              : isManualListening
              ? '🛑 Stop Listening'
              : '🎤 PRESS TO TALK'
            }
          </button>
        </div>

        {/* Status Display */}
        <div className="mb-3">
          <div className={`text-lg font-medium ${isManualListening ? 'text-green-400' : 'text-gray-400'}`}>
            {isManualListening ? '🎤 Manual Listening Active' : '⏸️ Ready for Manual Activation'}
          </div>
          {isManualListening && (
            <div className="mt-2 p-3 bg-blue-900/30 border border-blue-600/50 rounded text-blue-400 text-sm">
              💡 Say "Beta Bot" followed by your question, or use the text input below
            </div>
          )}
          {speechError && (
            <div className="mt-2 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
              ❌ {speechError}
            </div>
          )}
        </div>

        {/* Visual Indicators */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isManualListening ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Manual Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Listening</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'
            }`}></div>
            <span>Processing</span>
          </div>
        </div>
      </div>

      {/* Text Chat Input (Primary input method) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Text Input (Recommended)</h3>
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
            disabled={!textInput.trim() || isProcessing || !sessionActive}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            {isProcessing ? '⏳' : 'Send'}
          </button>
        </form>
        <p className="mt-2 text-sm text-green-400">
          ✅ RECOMMENDED: Text input is more reliable than speech in the current system state
        </p>
      </div>

      {/* Current Transcript */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Current Transcript</h3>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded p-3 text-gray-300">
            {transcript}
          </div>
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

      {/* Manual Mode Instructions */}
      <div className="mt-6 p-4 bg-green-900/20 border border-green-600/50 rounded">
        <h4 className="font-semibold mb-2 text-green-400">✅ Manual Mode Benefits</h4>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li><strong>System Stability:</strong> No constant processing overload</li>
          <li><strong>Better Accuracy:</strong> Focused listening when you're ready</li>
          <li><strong>No False Triggers:</strong> Only activates when you press the button</li>
          <li><strong>Reduced Logs:</strong> Eliminates thousands of repetitive console entries</li>
          <li><strong>Same Functionality:</strong> All BetaBot features still available</li>
        </ul>
      </div>

      {/* Usage Instructions */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/50 rounded">
        <h4 className="font-semibold mb-2 text-blue-400">📋 How to Use Manual Mode</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Click <strong>"Start Session"</strong> to activate BetaBot</li>
          <li><strong>RECOMMENDED:</strong> Use text input for questions</li>
          <li><strong>Speech Option:</strong> Press <strong>"PRESS TO TALK"</strong> button</li>
          <li>Say <strong>"Beta Bot"</strong> followed by your question within 30 seconds</li>
          <li>System auto-stops listening after each interaction</li>
        </ol>
      </div>
    </div>
  );
}
