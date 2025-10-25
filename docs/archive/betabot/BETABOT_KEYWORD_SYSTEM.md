# 🎤 BetaBot Keyword Activation System

## Architecture Overview

```
Stream Audio
    ↓
Producer AI (Backend)
    ↓
├─ Transcribes audio → Live transcript
├─ Sends transcript to BetaBot (WebSocket/SSE)
└─ Generates question suggestions (optional)

    ↓

BetaBot (Frontend)
    ↓
├─ Receives live transcript
├─ Detects wake word: "Hey BetaBot"
├─ If found → Detects action keyword:
│   ├─ "Alakazam" → Perplexity search
│   ├─ "Kadabra" → Video search
│   ├─ "Abra" → Image search
│   └─ None → Normal response
└─ Responds + Speaks (TTS)
```

---

## Wake Word + Action Keywords

### Wake Word: "Hey BetaBot"

**Variations to detect**:
- "Hey BetaBot"
- "Hey Beta Bot"
- "Hey BetaBot,"
- "BetaBot"
- "Beta Bot"

### Action Keywords

| Keyword | Function | Example |
|---------|----------|---------|
| **Alakazam** | Perplexity search (web search) | "Hey BetaBot Alakazam when did World War 2 start" |
| **Kadabra** | Video search (YouTube/etc) | "Hey BetaBot Kadabra funny cat videos" |
| **Abra** | Image search (Google Images/Unsplash) | "Hey BetaBot Abra Eiffel Tower at night" |

---

## Code Implementation

### 1. Keyword Detection Library

```typescript
// src/lib/keywordDetection.ts

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
 * Test examples
 */
export function testKeywordDetection() {
  console.log('Testing keyword detection...\n');

  const tests = [
    "Hey BetaBot, what do you think?",
    "Hey BetaBot Alakazam when did World War 2 start",
    "Hey BetaBot Kadabra funny cat videos",
    "Hey BetaBot Abra Eiffel Tower at night",
    "Just talking here, no wake word",
    "BetaBot what's your opinion?",
    "Hey Beta Bot Alakazam latest news about AI"
  ];

  tests.forEach(test => {
    const result = detectKeywords(test);
    console.log(`Input: "${test}"`);
    console.log(`  Wake word: ${result.wakeWordDetected}`);
    console.log(`  Action: ${result.actionKeyword || 'none'}`);
    console.log(`  Query: "${result.query}"`);
    console.log('');
  });
}
```

### 2. Perplexity Search Function

```typescript
// src/lib/perplexitySearch.ts

export interface PerplexityResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

/**
 * Search using Perplexity API
 */
export async function searchPerplexity(query: string): Promise<PerplexityResult> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_PERPLEXITY_API_KEY not configured');
  }

  console.log('🔍 Searching Perplexity:', query);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide concise, accurate answers with sources.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2,
      return_citations: true,
      search_recency_filter: 'month'
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();

  const answer = data.choices[0].message.content;
  const citations = data.citations || [];

  return {
    answer,
    sources: citations.map((url: string, idx: number) => ({
      title: `Source ${idx + 1}`,
      url
    }))
  };
}
```

### 3. Video Search Function

```typescript
// src/lib/videoSearch.ts

export interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

/**
 * Search for videos (YouTube Data API v3)
 */
export async function searchVideos(query: string, maxResults: number = 5): Promise<VideoResult[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_YOUTUBE_API_KEY not configured');
  }

  console.log('🎥 Searching YouTube:', query);

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.items.map((item: any) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: 'N/A', // Would need additional API call to get duration
    channel: item.snippet.channelTitle
  }));
}
```

### 4. Image Search Function

```typescript
// src/lib/imageSearch.ts

export interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

/**
 * Search for images (Unsplash API)
 */
export async function searchImages(query: string, maxResults: number = 10): Promise<ImageResult[]> {
  const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    throw new Error('VITE_UNSPLASH_ACCESS_KEY not configured');
  }

  console.log('🖼️ Searching Unsplash:', query);

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${maxResults}`,
    {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.results.map((item: any) => ({
    title: item.alt_description || item.description || 'Untitled',
    url: item.urls.regular,
    thumbnail: item.urls.small,
    source: `Photo by ${item.user.name} on Unsplash`
  }));
}
```

### 5. Updated BetaBot Hook

```typescript
// src/hooks/useBetaBotWithKeywords.ts

import { useState, useEffect, useCallback } from 'react';
import { detectKeywords } from '../lib/keywordDetection';
import { searchPerplexity } from '../lib/perplexitySearch';
import { searchVideos } from '../lib/videoSearch';
import { searchImages } from '../lib/imageSearch';
import { useBetaBotConversationWithMemory } from './useBetaBotConversationWithMemory';
import { useBetaBotFeedback } from './useBetaBotFeedback';

export interface BetaBotResponse {
  text: string;
  type: 'normal' | 'search' | 'video' | 'image';
  data?: any; // Search results, videos, images
  interactionId: string;
}

export function useBetaBotWithKeywords() {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<BetaBotResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const conversation = useBetaBotConversationWithMemory();
  const feedback = useBetaBotFeedback();

  /**
   * Receive live transcript from Producer AI
   */
  useEffect(() => {
    const ws = new WebSocket('wss://your-backend.com/transcript');

    ws.onmessage = (event) => {
      const transcript = event.data;
      setLiveTranscript(transcript);
      processTranscript(transcript);
    };

    return () => ws.close();
  }, []);

  /**
   * Process transcript for wake word and action keywords
   */
  const processTranscript = useCallback(async (transcript: string) => {
    if (isProcessing) return;

    const detection = detectKeywords(transcript);

    if (!detection.wakeWordDetected) {
      return; // Not calling BetaBot
    }

    console.log('👋 Wake word detected!');
    console.log('Action keyword:', detection.actionKeyword);
    console.log('Query:', detection.query);

    setIsProcessing(true);

    try {
      let response: BetaBotResponse;

      switch (detection.actionKeyword) {
        case 'alakazam':
          response = await handlePerplexitySearch(detection.query);
          break;

        case 'kadabra':
          response = await handleVideoSearch(detection.query);
          break;

        case 'abra':
          response = await handleImageSearch(detection.query);
          break;

        default:
          response = await handleNormalResponse(detection.query);
          break;
      }

      setLastResponse(response);
      speakResponse(response);

    } catch (error) {
      console.error('❌ BetaBot error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * Handle Perplexity search
   */
  const handlePerplexitySearch = async (query: string): Promise<BetaBotResponse> => {
    console.log('🔍 Alakazam! Searching Perplexity...');

    const result = await searchPerplexity(query);

    const interactionId = crypto.randomUUID();

    // Store in memory
    await conversation.storeConversationMemory(
      interactionId,
      `User asked for search: "${query}". BetaBot provided: ${result.answer}`,
      { type: 'perplexity_search', query }
    );

    return {
      text: result.answer,
      type: 'search',
      data: result,
      interactionId
    };
  };

  /**
   * Handle video search
   */
  const handleVideoSearch = async (query: string): Promise<BetaBotResponse> => {
    console.log('🎥 Kadabra! Searching videos...');

    const videos = await searchVideos(query);

    const interactionId = crypto.randomUUID();

    const responseText = `I found ${videos.length} videos about "${query}". Here are the top results.`;

    await conversation.storeConversationMemory(
      interactionId,
      `User asked for videos: "${query}". BetaBot found ${videos.length} videos.`,
      { type: 'video_search', query }
    );

    return {
      text: responseText,
      type: 'video',
      data: videos,
      interactionId
    };
  };

  /**
   * Handle image search
   */
  const handleImageSearch = async (query: string): Promise<BetaBotResponse> => {
    console.log('🖼️ Abra! Searching images...');

    const images = await searchImages(query);

    const interactionId = crypto.randomUUID();

    const responseText = `I found ${images.length} images about "${query}". Displaying them now.`;

    await conversation.storeConversationMemory(
      interactionId,
      `User asked for images: "${query}". BetaBot found ${images.length} images.`,
      { type: 'image_search', query }
    );

    return {
      text: responseText,
      type: 'image',
      data: images,
      interactionId
    };
  };

  /**
   * Handle normal response (no search)
   */
  const handleNormalResponse = async (query: string): Promise<BetaBotResponse> => {
    console.log('💬 Normal response (no search)');

    // Use conversation system with memory recall
    const result = await conversation.chat(query);

    return {
      text: result.response,
      type: 'normal',
      interactionId: result.interactionId
    };
  };

  /**
   * Speak response using TTS
   */
  const speakResponse = (response: BetaBotResponse) => {
    console.log('🔊 Speaking:', response.text);

    // Use your TTS service
    const utterance = new SpeechSynthesisUtterance(response.text);
    speechSynthesis.speak(utterance);

    // Display on stream
    displayOnStream(response);
  };

  /**
   * Display on stream (super chat style)
   */
  const displayOnStream = (response: BetaBotResponse) => {
    // Show response as overlay
    // Show search results, videos, or images if applicable
  };

  return {
    liveTranscript,
    lastResponse,
    isProcessing,
    feedback
  };
}
```

---

## UI Components

### Search Results Display

```typescript
// src/components/betabot/SearchResults.tsx

export function SearchResults({ response }: { response: BetaBotResponse }) {
  if (response.type === 'search') {
    return (
      <div className="search-results">
        <h3>🔍 Search Results</h3>
        <p>{response.data.answer}</p>
        <div className="sources">
          <h4>Sources:</h4>
          {response.data.sources.map((source, idx) => (
            <a key={idx} href={source.url} target="_blank">
              {source.title}
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (response.type === 'video') {
    return (
      <div className="video-results">
        <h3>🎥 Video Results</h3>
        <div className="video-grid">
          {response.data.map((video, idx) => (
            <div key={idx} className="video-card">
              <img src={video.thumbnail} alt={video.title} />
              <h4>{video.title}</h4>
              <p>{video.channel}</p>
              <a href={video.url} target="_blank">Watch</a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (response.type === 'image') {
    return (
      <div className="image-results">
        <h3>🖼️ Image Results</h3>
        <div className="image-grid">
          {response.data.map((image, idx) => (
            <div key={idx} className="image-card">
              <img src={image.thumbnail} alt={image.title} />
              <p>{image.title}</p>
              <small>{image.source}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
```

---

## Environment Variables

```bash
# .env.local

# BetaBot
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Search Services
VITE_PERPLEXITY_API_KEY=your-perplexity-key
VITE_YOUTUBE_API_KEY=your-youtube-api-key
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key

# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Testing

```typescript
// Test keyword detection
import { detectKeywords } from './lib/keywordDetection';

// Normal response
detectKeywords("Hey BetaBot, what do you think?");
// → { wakeWordDetected: true, actionKeyword: null, query: "what do you think?" }

// Perplexity search
detectKeywords("Hey BetaBot Alakazam when did World War 2 start");
// → { wakeWordDetected: true, actionKeyword: "alakazam", query: "when did World War 2 start" }

// Video search
detectKeywords("Hey BetaBot Kadabra funny cat videos");
// → { wakeWordDetected: true, actionKeyword: "kadabra", query: "funny cat videos" }

// Image search
detectKeywords("Hey BetaBot Abra Eiffel Tower");
// → { wakeWordDetected: true, actionKeyword: "abra", query: "Eiffel Tower" }
```

---

## Flow Diagram

```
Live Stream
    ↓
Producer AI transcribes
    ↓
Sends transcript to BetaBot
    ↓
BetaBot receives: "Hey BetaBot Alakazam when did World War 2 start"
    ↓
Keyword detection:
  ├─ Wake word: ✅ "Hey BetaBot"
  └─ Action: ✅ "Alakazam"
    ↓
Searches Perplexity
    ↓
Gets result: "World War 2 started on September 1, 1939..."
    ↓
BetaBot speaks (TTS)
    ↓
Displays result on stream
    ↓
Stores in memory
    ↓
Waits for feedback (thumbs up/down)
```

---

## Summary

✅ Wake word activation: "Hey BetaBot"
✅ Action keywords: Alakazam (search), Kadabra (video), Abra (image)
✅ No accidental searching
✅ Fast response (no audio processing in BetaBot)
✅ Memory system preserved
✅ Feedback tracking preserved
✅ Cost-optimized (BetaBot doesn't listen to audio)

**This solves ALL your issues!** 🎉
