import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BetaBotSuggestion {
  id: string;
  question_text: string;
  context_metadata: any;
  created_at: string;
}

export function useBetaBotSuggestionsManager() {
  const [suggestions, setSuggestions] = useState<BetaBotSuggestion[]>([]);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('show_questions')
        .select('id, question_text, context_metadata, created_at')
        .eq('source', 'betabot_conversation_helper')
        .eq('show_on_overlay', false) // Only show pending suggestions
        .order('created_at', { ascending: false})
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Failed to load BetaBot suggestions:', error);
    }
  };

  const addToPopupQueue = async (questionId: string) => {
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
      setSuggestions(prev => prev.filter(s => s.id !== questionId));

      console.log('✅ Question added to Popup Queue Manager');
    } catch (error) {
      console.error('Error adding question to queue:', error);
      // Even if position update fails, still remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== questionId));
    }
  };

  const dismiss = async (questionId: string) => {
    try {
      await supabase
        .from('show_questions')
        .delete()
        .eq('id', questionId);

      setSuggestions(prev => prev.filter(s => s.id !== questionId));
      console.log('✅ Dismissed suggestion');
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
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
        loadSuggestions();
      })
      .subscribe();

    return () => {
      suggestionsChannel.unsubscribe();
    };
  }, []);

  return {
    suggestions,
    loadSuggestions,
    addToPopupQueue,
    dismiss
  };
}
