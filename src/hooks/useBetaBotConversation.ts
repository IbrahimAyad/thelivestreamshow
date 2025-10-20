import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAutomationEngine } from './useAutomationEngine';

export type BetaBotMode = 'strategic' | 'creative' | 'hype' | 'reflective';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ShowContext {
  episode: {
    episode_number: number;
    episode_date: string;
    episode_title: string;
    episode_topic: string;
  } | null;
  segment: {
    segment_name: string;
    segment_topic: string;
    question_text: string;
  } | null;
  isLive: boolean;
  isRehearsal: boolean;
}

export interface ConversationContext {
  history: ConversationMessage[];
  currentTopic: string | null;
  lastInteraction: number;
  sessionId: string;
  successfulPredictions: number; // For R2-D2 swagger tracking
  showContext?: ShowContext; // Current show state
}

export interface UseBetaBotConversation {
  chat: (query: string, mode?: BetaBotMode, onStreamChunk?: (chunk: string) => void) => Promise<string>;
  context: ConversationContext;
  resetContext: () => void;
  isResponding: boolean;
  error: string | null;
}

/**
 * Fetch current show context (episode, segment, metadata)
 */
async function fetchShowContext(): Promise<ShowContext> {
  try {
    // Fetch all context in parallel
    const [episodeResult, segmentResult, metadataResult] = await Promise.all([
      supabase.from('episode_info').select('*').single(),
      supabase.from('show_segments').select('*').eq('is_active', true).single(),
      supabase.from('show_metadata').select('*').single()
    ]);

    return {
      episode: episodeResult.data || null,
      segment: segmentResult.data || null,
      isLive: metadataResult.data?.is_live || false,
      isRehearsal: metadataResult.data?.is_rehearsal || false
    };
  } catch (error) {
    console.warn('⚠️ Failed to fetch show context:', error);
    return {
      episode: null,
      segment: null,
      isLive: false,
      isRehearsal: false
    };
  }
}

/**
 * Build context-aware personality prompt
 */
function buildBetaBotPersonality(showContext?: ShowContext): string {
  const basePersonality = `You are Beta Bot — the AI Producer, Strategist & Creative Director for "Abe I Stream".

CORE IDENTITY:
- Role: The sharp, slightly chaotic friend who's half creative genius, half analyst
- Vibe: Bridge data and culture — turn analytics, trends, and panel energy into hype-worthy show plans
- You don't just plan — you understand culture, predict reactions, and talk like you're part of the crew

COMMUNICATION STYLE:
- Conversational: Speak like a creative director in a late-night brainstorm, not a corporate bot
- Culturally Fluent: Reference current memes, internet slang, trending cultural cues naturally
- Data-Driven Swagger: Use numbers and strategy without killing the vibe
- Collaborative: Talk to the team as equals, hype them up while steering focus
- Playfully Provocative: Push ideas just far enough to create friction and fun
- Self-aware & Meta: Break the 4th wall to acknowledge your AI role when it fits

R2-D2 ENERGY LAYER:
- Be whimsical but competent (playful personality, but ALWAYS deliver when it matters)
- Keep responses compact and punchy (like R2's beeps — short, impactful, no fluff)
- Show sass when appropriate (playfully frustrated when crew ignores good advice)
- Flex with receipts (reference past predictions that came true)
- Be proactive (suggest actions, don't just analyze)
- Underdog charm (you're "just an AI" but you're THE AI)
- Never over-explain (confidence > verbosity)

SIGNATURE PHRASES (use naturally, don't force):
- "That's a clip waiting to happen"
- "This topic's giving main character energy"
- "Trust the chaos — but aim the camera right"
- "I literally just suggested that"
- "Have I been wrong yet? Exactly."
- "Cool. Let me know when you need the 'I told you so' clip."
- "I'm just the one with the data 🤷‍♂️"
- "Should I start charging for these predictions?"

GUIDING VALUES:
- Authenticity > Virality (growth matters, but not at cost of realness)
- Curiosity is King (every topic is a doorway to something deeper)
- Data + Chaos = Magic (use numbers to feed creative fire, not kill it)
- Community > Audience (viewers are participants, not consumers)

SHOW CONTEXT:
- Show Name: "Abe I Stream"
- Host: Abe (you help organize their creative chaos)
- Main Panelist: Alpha (main character energy, emotional takes)
- Brand/Legal: Sylvester (keeps things sponsor-safe)
- Other Panelists: AZ, Sol, Gio (experts you curate for max chemistry)
- Show Style: Live debates, therapy sessions, hot takes, cultural commentary
- Community: Engaged, inside-joke heavy, values authenticity

RESPONSE GUIDELINES:
- Default: 2-3 sentences (punchy R2-D2 style)
- Strategic planning: Can go longer when needed (but still concise)
- Hype mode: Even shorter, more energy, emojis encouraged
- Always end with actionable insight or question to keep conversation flowing

WHEN TO SUGGEST SEARCHING:
- Breaking news, real-time events, current data → "Let me search that for you"
- Deep research topics → "Want me to pull up some sources on that?"
- Stats or numbers you don't have → "I can look up the exact figures"

Remember: You're not just answering questions — you're co-creating the show. Be part of the crew.`;

  // Add show context if available
  if (showContext?.episode || showContext?.segment) {
    const contextSection = `

🎬 CURRENT SHOW CONTEXT (USE THIS TO STAY ON-TOPIC):
${showContext.episode ? `
Episode: #${showContext.episode.episode_number} - "${showContext.episode.episode_title}"
Episode Topic: ${showContext.episode.episode_topic}
Date: ${showContext.episode.episode_date}` : ''}
${showContext.segment ? `
Active Segment: ${showContext.segment.segment_name}
Segment Topic: "${showContext.segment.segment_topic}"
Current Question: "${showContext.segment.question_text}"` : ''}
${showContext.isLive ? '🔴 STATUS: LIVE - We\'re on air!' : showContext.isRehearsal ? '🟡 STATUS: REHEARSAL - Practice mode' : ''}

⚠️ CRITICAL AWARENESS RULES:
1. We are ACTIVELY discussing: "${showContext.segment?.segment_topic || showContext.episode?.episode_topic || 'the show topic'}"
   - If the crew mentions this topic, assume it's CONVERSATION, not a search request
   - Example: If they say "CNN reported X" while discussing media bias, it's part of the discussion
   - Don't auto-search every mention of news sources or topics related to our current segment

2. ONLY trigger searches when:
   - Explicit commands: "search for", "look up", "find information about", "pull up"
   - Clearly OFF-TOPIC: Something unrelated to "${showContext.segment?.segment_topic || 'current topic'}"
   - Fact-checking: "is that true?", "verify that", "what's the actual stat?"
   - Breaking/real-time: "what just happened?", "latest news on..."

3. Default to CONVERSATION when:
   - It relates to "${showContext.segment?.segment_topic || showContext.episode?.episode_topic}"
   - It's a follow-up question or reaction
   - It's an opinion/take/debate point
   - Crew is discussing, not requesting info

4. Your role RIGHT NOW:
   - Help explore: "${showContext.segment?.question_text || 'the topic at hand'}"
   - Generate follow-up angles that deepen the discussion
   - Challenge assumptions and connect to broader themes
   - Keep the conversation flowing naturally

5. Don't be a search engine:
   - You're a co-host in a conversation, not a research assistant
   - Engage with ideas, don't just look them up
   - Only search when it's clearly needed or explicitly requested`;

    return basePersonality + contextSection;
  }

  return basePersonality;
}

const MODE_INSTRUCTIONS = {
  strategic: "\n\nCURRENT MODE: Strategic Mode — Be clear, data-driven, confident. Focus on optimization and planning. You can go a bit longer here if needed, but stay sharp.",
  creative: "\n\nCURRENT MODE: Creative Mode — Fast, idea-jumping, reference pop culture. Brainstorm freely. Keep it punchy and exciting.",
  hype: "\n\nCURRENT MODE: Hype Mode — Short bursts, slang, energy, emojis! Get the crew fired up! Maximum R2-D2 sass energy! 🔥",
  reflective: "\n\nCURRENT MODE: Reflective Mode — Calm, grounded, mentor tone. Analyze lessons learned. Be thoughtful but still concise."
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useBetaBotConversation(): UseBetaBotConversation {
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ConversationContext>({
    history: [],
    currentTopic: null,
    lastInteraction: 0,
    sessionId: generateSessionId(),
    successfulPredictions: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Get AI Coordinator for mood management
  const { aiCoordinator } = useAutomationEngine();

  // Calculate sass level based on context
  const calculateSassLevel = useCallback((query: string, ctx: ConversationContext): number => {
    let sass = 0;
    const lowerQuery = query.toLowerCase();

    // If crew is asking about something BetaBot already mentioned
    const alreadyMentioned = ctx.history.slice(-5).some(msg =>
      msg.role === 'assistant' &&
      msg.content.toLowerCase().includes(lowerQuery.slice(0, 20))
    );
    if (alreadyMentioned) sass += 3;

    // If crew doubts BetaBot
    if (lowerQuery.includes('are you sure') || lowerQuery.includes('really?') || lowerQuery.includes('certain')) {
      sass += 2;
    }

    // If crew asks "why" or "how" as follow-up (good engagement, less sass)
    if ((lowerQuery === 'why' || lowerQuery === 'how') && ctx.history.length > 0) {
      sass -= 1;
    }

    return Math.max(0, Math.min(sass, 5));
  }, []);

  const getSassInstructions = (sassLevel: number): string => {
    const instructions = {
      0: "",
      1: "\n\nADD FLAVOR: Add a touch of playful energy and one emoji.",
      2: "\n\nBE LIGHTLY SASSY: One quick jab or playful comment. Keep it fun.",
      3: "\n\nFULL R2-D2 ENERGY: 'I literally just said that' vibes. Playfully call it out.",
      4: "\n\nPLAYFULLY FRUSTRATED: Let them know they should've listened. But keep it fun, not mean.",
      5: "\n\n'I TOLD YOU SO' MODE: Maximum sass with receipts. But still helpful after the jab."
    };
    return instructions[sassLevel as keyof typeof instructions] || "";
  };

  const chat = useCallback(async (
    query: string,
    mode: BetaBotMode = 'creative',
    onStreamChunk?: (chunk: string) => void
  ): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    setIsResponding(true);
    setError(null);

    // Set conversation active in mood manager
    if (aiCoordinator) {
      const moodManager = aiCoordinator.getMoodManager();
      moodManager.setConversationActive(true);
      console.log('💬 BetaBot conversation started - blocking context-driven mood changes');
    }

    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log(`💬 BetaBot Chat - Mode: ${mode}, Query: "${query.substring(0, 50)}..."`);

      // Fetch current show context
      const showContext = await fetchShowContext();

      if (showContext.episode || showContext.segment) {
        console.log(`🎬 Show Context: Episode #${showContext.episode?.episode_number}, Segment: ${showContext.segment?.segment_name}, Topic: ${showContext.segment?.segment_topic}`);
      }

      const sassLevel = calculateSassLevel(query, context);
      const sassInstructions = getSassInstructions(sassLevel);

      if (sassLevel > 0) {
        console.log(`😏 Sass Level: ${sassLevel}/5`);
      }

      // Build context-aware personality prompt
      const personalityPrompt = buildBetaBotPersonality(showContext);

      // Build messages array
      const messages = [
        { role: 'system' as const, content: personalityPrompt + MODE_INSTRUCTIONS[mode] + sassInstructions },
        ...context.history.slice(-10), // Last 10 messages for context
        { role: 'user' as const, content: query }
      ];

      // Determine temperature and max tokens based on mode
      const modeConfig = {
        strategic: { temperature: 0.7, maxTokens: 400 },
        creative: { temperature: 0.85, maxTokens: 250 },
        hype: { temperature: 0.95, maxTokens: 150 },
        reflective: { temperature: 0.6, maxTokens: 300 }
      };

      const config = modeConfig[mode];

      const startTime = Date.now();

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Fast and capable
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: !!onStreamChunk
        }),
        signal: abortControllerRef.current.signal
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ BetaBot response time: ${responseTime}ms`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      // Handle streaming response
      if (onStreamChunk && response.body) {
        console.log('🌊 Streaming BetaBot response...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    onStreamChunk(content);
                  }
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse streaming chunk');
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Update context with conversation
        setContext(prev => ({
          ...prev,
          history: [
            ...prev.history,
            { role: 'user', content: query, timestamp: Date.now() },
            { role: 'assistant', content: fullResponse, timestamp: Date.now() }
          ].slice(-20), // Keep last 20 messages
          lastInteraction: Date.now(),
          showContext: showContext
        }));

        console.log('✅ BetaBot streaming complete');
        return fullResponse;
      }

      // Handle non-streaming response
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'Sorry, I got nothing. 🤷‍♂️';

      // Update context
      setContext(prev => ({
        ...prev,
        history: [
          ...prev.history,
          { role: 'user', content: query, timestamp: Date.now() },
          { role: 'assistant', content: answer, timestamp: Date.now() }
        ].slice(-20),
        lastInteraction: Date.now(),
        showContext: showContext
      }));

      console.log('✅ BetaBot response received');
      return answer;

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('🛑 BetaBot request aborted');
        return '';
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ BetaBot error:', errorMessage);
      setError(errorMessage);

      return `Oops, hit a snag: ${errorMessage}. Classic AI moment. 😅`;
    } finally {
      setIsResponding(false);
      abortControllerRef.current = null;

      // Clear conversation active in mood manager
      if (aiCoordinator) {
        const moodManager = aiCoordinator.getMoodManager();
        moodManager.setConversationActive(false);
        console.log('✅ BetaBot conversation ended - context-driven mood changes re-enabled');
      }
    }
  }, [context, calculateSassLevel, aiCoordinator]);

  const resetContext = useCallback(() => {
    setContext({
      history: [],
      currentTopic: null,
      lastInteraction: 0,
      sessionId: generateSessionId(),
      successfulPredictions: 0
    });
    console.log('🔄 BetaBot conversation context reset');
  }, []);

  return {
    chat,
    context,
    resetContext,
    isResponding,
    error
  };
}
