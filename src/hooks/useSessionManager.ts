import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SessionHistoryItem {
  id: string;
  session_name: string;
  created_at: string;
  total_questions_generated: number;
  total_direct_interactions: number;
  total_transcript_words: number;
}

export interface SessionManagerOptions {
  generatedQuestionsCount: number;
  directInteractions: number;
  conversationBuffer: string;
  onStopListening: () => void;
  onClearBuffer: () => void;
  onResetChatState: () => void; // Resets chatHistory and currentAISource
}

export function useSessionManager({
  generatedQuestionsCount,
  directInteractions,
  conversationBuffer,
  onStopListening,
  onClearBuffer,
  onResetChatState
}: SessionManagerOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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
      console.log('✅ Session created successfully:', data.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to create session:', errorMessage, error);
      alert(`Failed to create session: ${errorMessage}\n\nPlease check the console for details.`);
      onStopListening();
    }
  };

  const endSession = async (currentQuestionsCount?: number) => {
    if (!sessionId) return;

    const questionsCount = currentQuestionsCount ?? generatedQuestionsCount;

    try {
      console.log('🛑 Ending Beta Bot session...');

      // Calculate final metrics
      const wordCount = conversationBuffer.split(/\s+/).filter(w => w.length > 0).length;
      const sessionDuration = sessionTimer;

      // Log final transcript to conversation log
      if (conversationBuffer) {
        const { error: logError } = await supabase.from('betabot_conversation_log').insert([{
          session_id: sessionId,
          transcript_text: `[SESSION END] Final transcript:\n${conversationBuffer}`,
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
        total_questions_generated: questionsCount,
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
        - Questions Generated: ${questionsCount}
        - Direct Interactions: ${directInteractions}
        - Words Transcribed: ${wordCount}`);

      // Reset state
      setSessionId(null);
      setSessionTimer(0);
      onResetChatState();

      // Stop speech recognition and clear buffer
      onStopListening();
      onClearBuffer();

      // Reload session history
      loadSessionHistory();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to end session:', errorMessage, error);
      alert(`Failed to end session properly: ${errorMessage}`);
    }
  };

  // Session timer - increment every second
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Load session history on mount
  useEffect(() => {
    loadSessionHistory();
  }, []);

  return {
    sessionId,
    sessionTimer,
    sessionHistory,
    showHistory,
    setShowHistory,
    createSession,
    endSession,
    loadSessionHistory
  };
}
