// API Helper Utilities for Beta Bot

export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`API call failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export class RateLimiter {
  private callCount = 0;
  private resetTime = Date.now();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async checkLimit(maxCalls: number, perMinutes: number): Promise<void> {
    const now = Date.now();
    if (now - this.resetTime > perMinutes * 60000) {
      this.callCount = 0;
      this.resetTime = now;
    }
    
    if (this.callCount >= maxCalls) {
      const waitTime = Math.ceil((this.resetTime + perMinutes * 60000 - now) / 1000);
      throw new Error(`${this.name} rate limit exceeded. Try again in ${waitTime} seconds.`);
    }
    
    this.callCount++;
  }

  getRemainingCalls(maxCalls: number, perMinutes: number): number {
    const now = Date.now();
    if (now - this.resetTime > perMinutes * 60000) {
      return maxCalls;
    }
    return Math.max(0, maxCalls - this.callCount);
  }
}

export function detectWakePhrase(transcript: string): { detected: boolean; question: string } {
  const lowerTranscript = transcript.toLowerCase();
  
  const wakePhrases = [
    'beta bot',
    'ask beta bot',
    'hey beta bot',
    'betabot'
  ];
  
  for (const phrase of wakePhrases) {
    const index = lowerTranscript.indexOf(phrase);
    if (index !== -1) {
      const question = transcript.substring(index + phrase.length).trim();
      if (question.length > 5) {
        return { detected: true, question };
      }
    }
  }
  
  return { detected: false, question: '' };
}

export function detectVisualSearchCommand(transcript: string): { detected: boolean; query: string } {
  const commands = [
    { pattern: /show me (.+)/i, group: 1 },
    { pattern: /find (.+)/i, group: 1 },
    { pattern: /display (.+)/i, group: 1 },
    { pattern: /pull up (.+)/i, group: 1 },
    { pattern: /search for (.+)/i, group: 1 },
    { pattern: /what does (.+) look like/i, group: 1 },
    { pattern: /can you show (.+)/i, group: 1 },
    { pattern: /let me see (.+)/i, group: 1 }
  ];
  
  for (const { pattern, group } of commands) {
    const match = transcript.match(pattern);
    if (match && match[group]) {
      const query = match[group].trim();
      if (query.length > 3) {
        return { detected: true, query };
      }
    }
  }
  
  return { detected: false, query: '' };
}

export function exportTranscriptToFile(
  transcripts: Array<{ text: string; timestamp: Date }>,
  sessionMetadata: {
    startTime: Date;
    endTime: Date;
    questionsGenerated: number;
    interactions: number;
    wordCount: number;
  }
): void {
  const content = [
    '='.repeat(60),
    'Beta Bot AI Co-Host Transcript',
    '='.repeat(60),
    '',
    `Session Start: ${sessionMetadata.startTime.toLocaleString()}`,
    `Session End: ${sessionMetadata.endTime.toLocaleString()}`,
    `Duration: ${Math.floor((sessionMetadata.endTime.getTime() - sessionMetadata.startTime.getTime()) / 60000)} minutes`,
    `Total Words: ${sessionMetadata.wordCount}`,
    `Questions Generated: ${sessionMetadata.questionsGenerated}`,
    `Direct Interactions: ${sessionMetadata.interactions}`,
    '',
    '='.repeat(60),
    'Transcript',
    '='.repeat(60),
    '',
    ...transcripts.map(t => `[${t.timestamp.toLocaleTimeString()}] ${t.text}`),
    '',
    '='.repeat(60),
    'End of Transcript',
    '='.repeat(60)
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `betabot-transcript-${sessionMetadata.startTime.toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
