/**
 * Priority-Based Intent Detection System
 * Fixes the CNN routing bug and adds conversation mode
 */

import { BetaBotMode, ShowContext } from '../hooks/useBetaBotConversation';

export type IntentType =
  | 'conversation'      // Chat with BetaBot
  | 'search_web'       // Perplexity search
  | 'search_video'     // Video search
  | 'follow_up';       // Continue previous conversation

export interface IntentScore {
  type: IntentType;
  confidence: number;
  reasoning: string[];
  metadata?: {
    recency?: 'day' | 'week' | 'month' | 'year';
    domains?: string[];
    model?: 'sonar' | 'sonar-pro';
    mode?: BetaBotMode;
  };
}

export interface EnhancedConversationContext {
  hasRecentContext: boolean;
  lastTimestamp?: number;
  turnCount?: number;
  recentMessages?: string[];
  showContext?: ShowContext;
}

/**
 * Dual-nature entities (news sources + video channels)
 */
const DUAL_ENTITIES = {
  'cnn': {
    newsContext: ['news from cnn', 'cnn report', 'according to cnn', 'cnn said', 'breaking cnn'],
    videoContext: ['watch cnn', 'cnn video', 'cnn coverage', 'cnn live stream'],
    newsPreference: ['cnn.com'],
    videoPreference: 'cnn'
  },
  'espn': {
    newsContext: ['espn news', 'espn report', 'scores', 'standings', 'stats', 'trade'],
    videoContext: ['watch espn', 'espn video', 'highlights', 'game', 'match'],
    newsPreference: ['espn.com'],
    videoPreference: 'espn'
  }
};

/**
 * Video-only channels (no ambiguity)
 */
const VIDEO_CHANNELS = [
  'joe rogan', 'jre', 'lex fridman',
  'mkbhd', 'marques brownlee', 'linus tech tips',
  'mrbeast', 'pewdiepie', 'ninja'
];

/**
 * Calculate intent scores for a query
 */
export function calculateIntentScores(
  query: string,
  context: EnhancedConversationContext = { hasRecentContext: false }
): IntentScore {
  const lowerQuery = query.toLowerCase().trim();
  let conversationScore = 0;
  let webSearchScore = 0;
  let videoSearchScore = 0;
  let followUpScore = 0;
  const reasoning: string[] = [];

  const { hasRecentContext, lastTimestamp, turnCount, showContext } = context;

  // PRIORITY 1: Explicit overrides (always win)
  // ==========================================

  // Explicit web search commands
  const explicitWebKeywords = ['search for', 'look up', 'find information about', 'research', 'google'];
  if (explicitWebKeywords.some(kw => lowerQuery.includes(kw))) {
    webSearchScore += 100;
    reasoning.push('Explicit web search keyword detected (+100 web)');
  }

  // Explicit video commands
  const explicitVideoKeywords = ['watch', 'play video', 'show me video', 'find videos', 'pull up video'];
  if (explicitVideoKeywords.some(kw => lowerQuery.includes(kw))) {
    videoSearchScore += 100;
    reasoning.push('Explicit video command detected (+100 video)');
  }

  // PRIORITY 2: Follow-up detection (if recent context exists)
  // ===========================================================

  if (hasRecentContext) {
    const followUpKeywords = ['why', 'how', 'when', 'where', 'what about', 'tell me more', 'explain', 'continue', 'elaborate'];
    const isShortQuery = lowerQuery.split(' ').length <= 3;
    const isFollowUpWord = followUpKeywords.some(kw => lowerQuery.startsWith(kw) || lowerQuery === kw);

    if (isFollowUpWord && isShortQuery) {
      followUpScore += 80;
      reasoning.push('Follow-up question detected (+80 follow-up)');
    }
  }

  // PRIORITY 2.5: Context-aware scoring adjustments
  // ================================================

  // Active conversation boost
  const isActiveConversation = hasRecentContext &&
    lastTimestamp &&
    (Date.now() - lastTimestamp) < 30000 && // Within 30 seconds
    turnCount && turnCount >= 2;

  if (isActiveConversation) {
    webSearchScore *= 0.5; // Halve search scores during active conversation
    conversationScore += 30;
    reasoning.push('Active conversation detected (+30 conversation, -50% search)');
  }

  // Show context filtering - if query mentions current topic
  if (showContext?.segment?.segment_topic) {
    const currentTopic = showContext.segment.segment_topic.toLowerCase();
    const topicKeywords = currentTopic.split(' ').filter(w => w.length > 3);

    const mentionsCurrentTopic = topicKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );

    if (mentionsCurrentTopic) {
      conversationScore += 40;
      webSearchScore = Math.max(0, webSearchScore - 20);
      reasoning.push(`Query relates to current segment topic: "${showContext.segment.segment_topic}" (+40 conversation, -20 search)`);
    }
  }

  // Episode topic awareness
  if (showContext?.episode?.episode_topic) {
    const episodeTopic = showContext.episode.episode_topic.toLowerCase();
    const topicKeywords = episodeTopic.split(' ').filter(w => w.length > 3);

    const mentionsEpisodeTopic = topicKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );

    if (mentionsEpisodeTopic && !reasoning.some(r => r.includes('current segment topic'))) {
      conversationScore += 30;
      webSearchScore = Math.max(0, webSearchScore - 15);
      reasoning.push(`Query relates to episode topic: "${showContext.episode.episode_topic}" (+30 conversation, -15 search)`);
    }
  }

  // PRIORITY 3: Conversational patterns
  // ====================================

  // Greetings
  const greetings = ['hey', 'hello', 'hi', 'what\'s up', 'sup', 'yo'];
  if (greetings.some(g => lowerQuery.startsWith(g))) {
    conversationScore += 60;
    reasoning.push('Greeting detected (+60 conversation)');
  }

  // Opinion requests
  const opinionKeywords = ['what do you think', 'your opinion', 'do you like', 'your favorite', 'your take'];
  if (opinionKeywords.some(kw => lowerQuery.includes(kw))) {
    conversationScore += 70;
    reasoning.push('Opinion request detected (+70 conversation)');
  }

  // Personal questions
  const personalKeywords = ['who are you', 'what can you do', 'your name', 'introduce yourself', 'about you'];
  if (personalKeywords.some(kw => lowerQuery.includes(kw))) {
    conversationScore += 70;
    reasoning.push('Personal question detected (+70 conversation)');
  }

  // Reactions (short, conversational)
  const reactions = ['cool', 'interesting', 'wow', 'nice', 'awesome', 'that\'s wild', 'no way', 'really'];
  if (reactions.some(r => lowerQuery === r || lowerQuery.startsWith(r + ' '))) {
    conversationScore += 50;
    reasoning.push('Reaction detected (+50 conversation)');
  }

  // PRIORITY 4: Context-aware entity resolution
  // ============================================

  for (const [entity, contexts] of Object.entries(DUAL_ENTITIES)) {
    if (lowerQuery.includes(entity)) {
      // Check for news context first
      const hasNewsContext = contexts.newsContext.some(ctx => lowerQuery.includes(ctx));
      const hasVideoContext = contexts.videoContext.some(ctx => lowerQuery.includes(ctx));

      if (hasNewsContext) {
        webSearchScore += 50;
        reasoning.push(`${entity.toUpperCase()} in news context (+50 web)`);
      } else if (hasVideoContext) {
        videoSearchScore += 50;
        reasoning.push(`${entity.toUpperCase()} in video context (+50 video)`);
      } else {
        // Ambiguous - give small boost to both
        webSearchScore += 15;
        videoSearchScore += 15;
        reasoning.push(`${entity.toUpperCase()} mentioned but context ambiguous (+15 both)`);
      }
    }
  }

  // Video-only channels (no ambiguity)
  if (VIDEO_CHANNELS.some(channel => lowerQuery.includes(channel))) {
    videoSearchScore += 40;
    reasoning.push('Video-only channel mentioned (+40 video)');
  }

  // PRIORITY 5: Topic-based scoring
  // ================================

  // News/Headlines keywords
  const newsKeywords = ['news', 'headlines', 'breaking', 'report', 'reported', 'according to'];
  if (newsKeywords.some(kw => lowerQuery.includes(kw))) {
    webSearchScore += 40;
    reasoning.push('News topic keyword detected (+40 web)');
  }

  // Current events / real-time data
  const realtimeKeywords = ['latest', 'current', 'today', 'now', 'right now', 'just happened', 'live'];
  if (realtimeKeywords.some(kw => lowerQuery.includes(kw))) {
    webSearchScore += 35;
    reasoning.push('Real-time data request (+35 web)');
  }

  // Trending / Popular (ambiguous, but news context wins)
  const trendingKeywords = ['trending', 'viral', 'popular'];
  if (trendingKeywords.some(kw => lowerQuery.includes(kw))) {
    const hasNewsModifier = newsKeywords.some(kw => lowerQuery.includes(kw));
    if (hasNewsModifier) {
      webSearchScore += 30;
      reasoning.push('Trending + news context (+30 web)');
    } else {
      videoSearchScore += 20;
      webSearchScore += 10;
      reasoning.push('Trending keyword (ambiguous, +20 video, +10 web)');
    }
  }

  // Simple factual questions (BetaBot can handle)
  const factualKeywords = ['what is', 'define', 'meaning of', 'how do you spell', 'what\'s'];
  if (factualKeywords.some(kw => lowerQuery.startsWith(kw))) {
    conversationScore += 30;
    reasoning.push('Simple factual question (+30 conversation)');
  }

  // PRIORITY 6: Detect voice filters (for web search)
  // ==================================================

  let metadata: IntentScore['metadata'] = {};

  // Time range filters
  const timeFilters = {
    day: ['today', 'today\'s', 'this morning', 'right now'],
    week: ['this week', 'past week', 'last week', 'recent', 'recently'],
    month: ['this month', 'past month', 'last month'],
    year: ['this year', 'past year', 'last year']
  };

  for (const [range, keywords] of Object.entries(timeFilters)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      metadata.recency = range as 'day' | 'week' | 'month' | 'year';
      reasoning.push(`Time filter detected: ${range}`);
      break;
    }
  }

  // Domain filters
  const domainFilters = {
    news: ['news', 'headlines', 'breaking', 'report'],
    tech: ['tech', 'technology', 'silicon valley', 'startup', 'ai', 'software'],
    academic: ['research', 'study', 'academic', 'scientific', 'journal']
  };

  for (const [domain, keywords] of Object.entries(domainFilters)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      if (domain === 'news') {
        metadata.domains = ['cnn.com', 'bbc.com', 'reuters.com', 'apnews.com', 'npr.org'];
      } else if (domain === 'tech') {
        metadata.domains = ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com'];
      } else if (domain === 'academic') {
        metadata.domains = ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov'];
      }
      reasoning.push(`Domain filter detected: ${domain}`);
      break;
    }
  }

  // Sonar Pro detection
  if (lowerQuery.includes('detailed') || lowerQuery.includes('in-depth') || lowerQuery.includes('comprehensive')) {
    metadata.model = 'sonar-pro';
    reasoning.push('Sonar Pro requested (detailed analysis)');
  }

  // PRIORITY 7: Detect BetaBot mode for conversation
  // =================================================

  if (conversationScore > 0) {
    // Detect mode based on keywords
    if (lowerQuery.includes('plan') || lowerQuery.includes('strategy') || lowerQuery.includes('analytics')) {
      metadata.mode = 'strategic';
    } else if (lowerQuery.includes('let\'s go') || lowerQuery.includes('hype') || lowerQuery.includes('🔥')) {
      metadata.mode = 'hype';
    } else if (lowerQuery.includes('how did') || lowerQuery.includes('feedback') || lowerQuery.includes('what went')) {
      metadata.mode = 'reflective';
    } else {
      metadata.mode = 'creative'; // Default
    }
  }

  // FINAL: Determine winner
  // =======================

  const scores = [
    { type: 'follow_up' as IntentType, score: followUpScore },
    { type: 'conversation' as IntentType, score: conversationScore },
    { type: 'search_web' as IntentType, score: webSearchScore },
    { type: 'search_video' as IntentType, score: videoSearchScore }
  ];

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  // If scores are very low and no clear winner, default to conversation
  if (winner.score < 20) {
    reasoning.push('No strong intent detected, defaulting to conversation');
    return {
      type: 'conversation',
      confidence: 50,
      reasoning,
      metadata: { mode: 'creative' }
    };
  }

  // Log decision
  console.log('🎯 Intent Scoring:', {
    query: query.substring(0, 50),
    scores: {
      conversation: conversationScore,
      web: webSearchScore,
      video: videoSearchScore,
      followUp: followUpScore
    },
    winner: winner.type,
    confidence: winner.score
  });

  return {
    type: winner.type,
    confidence: winner.score,
    reasoning,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  };
}

/**
 * Quick check if query needs real-time data (fallback logic)
 */
export function needsRealTimeData(text: string): boolean {
  const realtimeKeywords = [
    'weather', 'stock', 'price', 'score', 'live', 'breaking',
    'current', 'latest', 'now', 'today', 'right now'
  ];
  const lowerText = text.toLowerCase();
  return realtimeKeywords.some(keyword => lowerText.includes(keyword));
}
