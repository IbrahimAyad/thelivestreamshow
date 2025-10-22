/**
 * Keyword Detection for BetaBot
 *
 * Detects wake word ("Hey BetaBot") and action keywords
 * (Alakazam, Kadabra, Abra)
 */

export interface KeywordMatch {
  wakeWordDetected: boolean;
  actionKeyword: 'alakazam' | 'kadabra' | 'abra' | null;
  query: string;
  rawText: string;
}

/**
 * Detect wake word and action keywords in transcript
 */
export function detectKeywords(transcript: string): KeywordMatch {
  const normalized = transcript.toLowerCase().trim();

  // Wake word variations
  const wakeWordPatterns = [
    /hey\s+beta\s*bot/i,
    /hey\s+betabot/i,
    /beta\s*bot/i,
    /betabot/i
  ];

  // Check for wake word
  let wakeWordDetected = false;
  let afterWakeWord = '';

  for (const pattern of wakeWordPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      wakeWordDetected = true;
      // Get text after wake word
      afterWakeWord = normalized.substring(match.index! + match[0].length).trim();
      break;
    }
  }

  if (!wakeWordDetected) {
    return {
      wakeWordDetected: false,
      actionKeyword: null,
      query: '',
      rawText: transcript
    };
  }

  // Remove common punctuation/filler
  afterWakeWord = afterWakeWord.replace(/^[,.\s]+/, '');

  // Check for action keywords
  let actionKeyword: 'alakazam' | 'kadabra' | 'abra' | null = null;
  let query = afterWakeWord;

  if (afterWakeWord.startsWith('alakazam')) {
    actionKeyword = 'alakazam';
    query = afterWakeWord.substring('alakazam'.length).trim();
  } else if (afterWakeWord.startsWith('kadabra')) {
    actionKeyword = 'kadabra';
    query = afterWakeWord.substring('kadabra'.length).trim();
  } else if (afterWakeWord.startsWith('abra')) {
    actionKeyword = 'abra';
    query = afterWakeWord.substring('abra'.length).trim();
  }

  return {
    wakeWordDetected: true,
    actionKeyword,
    query,
    rawText: transcript
  };
}

/**
 * Test keyword detection with examples
 */
export function testKeywordDetection() {
  console.log('🧪 Testing keyword detection...\n');

  const tests = [
    "Hey BetaBot, what do you think?",
    "Hey BetaBot Alakazam when did World War 2 start",
    "Hey BetaBot Kadabra funny cat videos",
    "Hey BetaBot Abra Eiffel Tower at night",
    "Just talking here, no wake word",
    "BetaBot what's your opinion?",
    "Hey Beta Bot Alakazam latest news about AI",
    "Hey BetaBot, Alakazam what is the weather today",
  ];

  tests.forEach(test => {
    const result = detectKeywords(test);
    console.log(`Input: "${test}"`);
    console.log(`  ✓ Wake word: ${result.wakeWordDetected}`);
    console.log(`  ✓ Action: ${result.actionKeyword || 'none'}`);
    console.log(`  ✓ Query: "${result.query}"`);
    console.log('');
  });
}
