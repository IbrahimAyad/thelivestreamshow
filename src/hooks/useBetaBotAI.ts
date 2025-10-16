import { useState, useCallback, useRef } from 'react';
import { apiCallWithRetry, RateLimiter } from '../utils/apiHelpers';

export interface UseBetaBotAI {
  generateQuestions: (context: string) => Promise<string[]>;
  respondToQuestion: (question: string, context?: string) => Promise<string>;
  isProcessing: boolean;
  error: string | null;
  apiHealth: {
    gemini: 'healthy' | 'degraded' | 'down';
    openai: 'healthy' | 'degraded' | 'down';
  };
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export function useBetaBotAI(): UseBetaBotAI {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<{
    gemini: 'healthy' | 'degraded' | 'down';
    openai: 'healthy' | 'degraded' | 'down';
  }>({ gemini: 'healthy', openai: 'healthy' });

  const geminiLimiter = useRef(new RateLimiter('Gemini'));
  const openaiLimiter = useRef(new RateLimiter('OpenAI'));

  const generateQuestions = useCallback(async (context: string): Promise<string[]> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check rate limit (50 requests per minute to stay under 60 free tier)
      await geminiLimiter.current.checkLimit(50, 1);

      const prompt = `Based on this conversation context, generate 2-3 engaging follow-up questions that would be interesting for a live stream discussion. Return only the questions as a numbered list.\n\nContext: ${context}\n\nQuestions:`;

      const callGeminiAPI = async () => {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to generate questions');
        }

        return await response.json();
      };

      // Use retry logic
      const data = await apiCallWithRetry(callGeminiAPI, 3, 1000);
      
      setApiHealth(prev => ({ ...prev, gemini: 'healthy' }));
      
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse numbered list into array
      const questions = generatedText
        .split('\n')
        .filter((line: string) => line.trim().match(/^\d+\./)) // Match lines starting with numbers
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
        .filter((q: string) => q.length > 0);

      return questions.slice(0, 3); // Max 3 questions

    } catch (err) {
      console.error('Gemini API error:', err);
      setApiHealth(prev => ({ ...prev, gemini: 'down' }));
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const respondToQuestion = useCallback(async (question: string, context?: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Check rate limit (conservative limit for GPT-4)
      await openaiLimiter.current.checkLimit(50, 1);

      const messages = [
        {
          role: 'system',
          content: 'You are Beta Bot, an AI co-host for a professional live stream. Provide concise, helpful, and engaging responses (2-3 sentences). Be friendly and knowledgeable. Add personality but stay professional.'
        },
        ...(context ? [{
          role: 'user',
          content: `Context from the stream: ${context}`
        }] : []),
        {
          role: 'user',
          content: question
        }
      ];

      const callOpenAIAPI = async () => {
        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages,
            temperature: 0.8,
            max_tokens: 150
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to get response');
        }

        return await response.json();
      };

      // Use retry logic
      const data = await apiCallWithRetry(callOpenAIAPI, 3, 1000);
      
      setApiHealth(prev => ({ ...prev, openai: 'healthy' }));
      
      const botResponse = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

      return botResponse;

    } catch (err) {
      console.error('OpenAI API error:', err);
      setApiHealth(prev => ({ ...prev, openai: 'down' }));
      setError(err instanceof Error ? err.message : 'Failed to get response');
      return 'Sorry, I encountered an error. Please try again.';
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    generateQuestions,
    respondToQuestion,
    isProcessing,
    error,
    apiHealth
  };
}
