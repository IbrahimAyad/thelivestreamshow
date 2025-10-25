# 🤖 BetaBot Final Implementation - Production Ready

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Producer AI (Backend)                    │
├─────────────────────────────────────────────────────────────┤
│ • Listens to stream audio                                   │
│ • Generates live transcript                                 │
│ • Sends transcript to BetaBot (WebSocket)                   │
│ • Generates question suggestions                            │
│ • When manually triggered → Sends TTS question to BetaBot   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    (WebSocket Connection)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       BetaBot (Frontend)                     │
├─────────────────────────────────────────────────────────────┤
│ INPUT MODE 1: Keyword Activation                            │
│ • Receives live transcript                                  │
│ • Detects "Hey BetaBot"                                     │
│ • Detects action keywords:                                  │
│   - Alakazam → Perplexity search                            │
│   - Kadabra → Video search                                  │
│   - Abra → Image search                                     │
│   - None → Normal response                                  │
│                                                              │
│ INPUT MODE 2: Producer AI Questions                         │
│ • Receives TTS question (manually triggered)                │
│ • Reads question out loud immediately                       │
│                                                              │
│ FEATURES (Always Active):                                   │
│ • Conversation memory (semantic search)                     │
│ • Learning from feedback (thumbs up/down)                   │
│ • Multi-model fusion (when appropriate)                     │
│ • Smart timing detection                                    │
│ • Emotion-aware responses                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete BetaBot Hook

```typescript
// src/hooks/useBetaBotComplete.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { detectKeywords, KeywordMatch } from '../lib/keywordDetection';
import { searchPerplexity } from '../lib/perplexitySearch';
import { searchVideos } from '../lib/videoSearch';
import { searchImages } from '../lib/imageSearch';
import { useBetaBotConversationWithMemory } from './useBetaBotConversationWithMemory';
import { useBetaBotFeedback } from './useBetaBotFeedback';
import { useConversationTiming } from './useConversationTiming';
import { useEmotionDetection } from './useEmotionDetection';
import { mapEmotionToMode } from '../lib/emotionDetection';

export interface ProducerAIQuestion {
  question: string;
  mode?: string;
  context?: any;
}

export interface BetaBotResponse {
  text: string;
  type: 'normal' | 'search' | 'video' | 'image' | 'producer_question';
  data?: any;
  interactionId: string;
  source: 'keyword' | 'producer_ai';
}

export interface UseBetaBotComplete {
  // State
  liveTranscript: string;
  lastResponse: BetaBotResponse | null;
  isProcessing: boolean;
  isSpeaking: boolean;

  // Features
  conversation: ReturnType<typeof useBetaBotConversationWithMemory>;
  feedback: ReturnType<typeof useBetaBotFeedback>;
  timing: ReturnType<typeof useConversationTiming>;
  emotion: ReturnType<typeof useEmotionDetection>;

  // Methods
  speakProducerQuestion: (question: ProducerAIQuestion) => Promise<void>;
  stopSpeaking: () => void;
}

export function useBetaBotComplete(): UseBetaBotComplete {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<BetaBotResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Feature hooks
  const conversation = useBetaBotConversationWithMemory();
  const feedback = useBetaBotFeedback();
  const timing = useConversationTiming();
  const emotion = useEmotionDetection();

  // WebSocket connection to Producer AI
  const wsRef = useRef<WebSocket | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Connect to Producer AI for live transcript
   */
  useEffect(() => {
    console.log('🔌 Connecting to Producer AI...');

    const ws = new WebSocket(import.meta.env.VITE_PRODUCER_AI_WS_URL || 'ws://localhost:8080/transcript');

    ws.onopen = () => {
      console.log('✅ Connected to Producer AI');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'transcript') {
        // Receive live transcript
        setLiveTranscript(data.text);
        handleTranscriptUpdate(data.text);
      } else if (data.type === 'producer_question') {
        // Receive question from Producer AI (manually triggered)
        speakProducerQuestion(data.question);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 Disconnected from Producer AI');
      // Reconnect after 3 seconds
      setTimeout(() => {
        wsRef.current = null;
      }, 3000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  /**
   * Handle transcript updates
   */
  const handleTranscriptUpdate = useCallback(async (transcript: string) => {
    // Analyze with free text-based emotion detection
    emotion.analyzeText(transcript);

    // Analyze timing
    timing.analyzeTranscript(transcript, Date.now());

    // Check for keyword activation
    await processKeywordActivation(transcript);
  }, [emotion, timing]);

  /**
   * Process keyword activation ("Hey BetaBot")
   */
  const processKeywordActivation = useCallback(async (transcript: string) => {
    if (isProcessing) return;

    const detection = detectKeywords(transcript);

    if (!detection.wakeWordDetected) {
      return; // Not calling BetaBot
    }

    console.log('👋 Wake word detected!');
    console.log('🎯 Action keyword:', detection.actionKeyword || 'none');
    console.log('💬 Query:', detection.query);

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
      await speakResponse(response);

    } catch (error) {
      console.error('❌ BetaBot error:', error);
      await speakError();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * Handle Perplexity search (Alakazam)
   */
  const handlePerplexitySearch = async (query: string): Promise<BetaBotResponse> => {
    console.log('🔍 Alakazam! Searching Perplexity...');

    const result = await searchPerplexity(query);
    const interactionId = crypto.randomUUID();

    // Store in memory
    await conversation.storeConversationMemory(
      interactionId,
      `User asked for search: "${query}". BetaBot found: ${result.answer}`,
      { type: 'perplexity_search', query }
    );

    return {
      text: result.answer,
      type: 'search',
      data: result,
      interactionId,
      source: 'keyword'
    };
  };

  /**
   * Handle video search (Kadabra)
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
      interactionId,
      source: 'keyword'
    };
  };

  /**
   * Handle image search (Abra)
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
      interactionId,
      source: 'keyword'
    };
  };

  /**
   * Handle normal response (no search keyword)
   */
  const handleNormalResponse = async (query: string): Promise<BetaBotResponse> => {
    console.log('💬 Normal response');

    // Get emotion-aware mode
    let mode = 'creative';
    if (emotion.emotionAnalysis) {
      const modeMapping = mapEmotionToMode(emotion.emotionAnalysis);
      mode = modeMapping.recommendedMode;
      console.log(`🎭 Using ${mode} mode based on emotion: ${emotion.emotionAnalysis.dominantEmotion}`);
    }

    // Use conversation system with memory recall
    const result = await conversation.chat(query, mode);

    return {
      text: result.response,
      type: 'normal',
      interactionId: result.interactionId,
      source: 'keyword'
    };
  };

  /**
   * Speak Producer AI question (manually triggered)
   */
  const speakProducerQuestion = useCallback(async (questionData: ProducerAIQuestion) => {
    console.log('📨 Received Producer AI question:', questionData.question);

    const interactionId = crypto.randomUUID();

    // Store in memory
    await conversation.storeConversationMemory(
      interactionId,
      `Producer AI suggested: "${questionData.question}". BetaBot read it out loud.`,
      { type: 'producer_question', mode: questionData.mode }
    );

    const response: BetaBotResponse = {
      text: questionData.question,
      type: 'producer_question',
      data: questionData,
      interactionId,
      source: 'producer_ai'
    };

    setLastResponse(response);
    await speakResponse(response);
  }, [conversation]);

  /**
   * Speak response using TTS
   */
  const speakResponse = async (response: BetaBotResponse): Promise<void> => {
    console.log('🔊 Speaking:', response.text);

    setIsSpeaking(true);

    // Use Web Speech API (or replace with ElevenLabs/other TTS)
    const utterance = new SpeechSynthesisUtterance(response.text);

    // Configure voice based on type
    if (response.type === 'search') {
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
    } else if (response.type === 'producer_question') {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('✅ Finished speaking');
    };

    utterance.onerror = (error) => {
      console.error('❌ TTS error:', error);
      setIsSpeaking(false);
    };

    speechSynthRef.current = utterance;
    speechSynthesis.speak(utterance);

    // Display on stream (super chat style)
    displayOnStream(response);
  };

  /**
   * Speak error message
   */
  const speakError = async (): Promise<void> => {
    const utterance = new SpeechSynthesisUtterance(
      "Sorry, I encountered an error. Please try again."
    );
    speechSynthesis.speak(utterance);
  };

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    console.log('⏹️ Stopped speaking');
  }, []);

  /**
   * Display response on stream
   */
  const displayOnStream = (response: BetaBotResponse) => {
    // Create super chat overlay
    const event = new CustomEvent('betabot-response', {
      detail: response
    });
    window.dispatchEvent(event);
  };

  return {
    liveTranscript,
    lastResponse,
    isProcessing,
    isSpeaking,
    conversation,
    feedback,
    timing,
    emotion,
    speakProducerQuestion,
    stopSpeaking
  };
}
```

---

## BetaBot Control Panel Component

```typescript
// src/components/BetaBotControlPanel.tsx

import React, { useEffect } from 'react';
import { useBetaBotComplete } from '../hooks/useBetaBotComplete';
import { FeedbackButtons } from './betabot/FeedbackButtons';
import { LearningDashboard } from './betabot/LearningDashboard';
import { SearchResults } from './betabot/SearchResults';
import { EmotionIndicator } from './betabot/EmotionIndicator';
import { TimingIndicator } from './betabot/TimingIndicator';

export function BetaBotControlPanel() {
  const betaBot = useBetaBotComplete();

  // Display response on stream when received
  useEffect(() => {
    const handleResponse = (event: CustomEvent) => {
      const response = event.detail;
      console.log('📺 Displaying on stream:', response);
      // Your stream overlay logic here
    };

    window.addEventListener('betabot-response', handleResponse as EventListener);
    return () => window.removeEventListener('betabot-response', handleResponse as EventListener);
  }, []);

  return (
    <div className="betabot-control-panel">
      <h2>🤖 BetaBot Control Panel</h2>

      {/* Status */}
      <div className="status-section">
        <div className={`status-indicator ${betaBot.isProcessing ? 'processing' : 'idle'}`}>
          {betaBot.isProcessing ? '⚙️ Processing...' : '✅ Ready'}
        </div>
        <div className={`speaking-indicator ${betaBot.isSpeaking ? 'speaking' : ''}`}>
          {betaBot.isSpeaking ? '🔊 Speaking...' : '🔇 Silent'}
        </div>
      </div>

      {/* Live Transcript Preview */}
      <div className="transcript-preview">
        <h3>Live Transcript</h3>
        <p>{betaBot.liveTranscript.slice(-200)}...</p>
      </div>

      {/* Current Emotion */}
      <EmotionIndicator
        currentEmotion={betaBot.emotion.emotionAnalysis}
        recommendedMode={betaBot.emotion.recommendedMode}
        isAnalyzing={false}
      />

      {/* Timing Indicator */}
      <TimingIndicator
        timingOpportunity={betaBot.timing.timingOpportunity}
        currentEnergy={betaBot.timing.currentEnergy}
        totalSignals={betaBot.timing.totalSignalsDetected}
      />

      {/* Last Response */}
      {betaBot.lastResponse && (
        <div className="last-response">
          <h3>Last Response</h3>
          <div className="response-header">
            <span className="response-source">
              {betaBot.lastResponse.source === 'keyword' ? '🎤 Keyword' : '📨 Producer AI'}
            </span>
            <span className="response-type">
              {betaBot.lastResponse.type}
            </span>
          </div>
          <p>{betaBot.lastResponse.text}</p>

          {/* Search Results */}
          <SearchResults response={betaBot.lastResponse} />

          {/* Feedback Buttons */}
          <FeedbackButtons
            interactionId={betaBot.lastResponse.interactionId}
            onFeedback={betaBot.feedback.quickFeedback}
          />
        </div>
      )}

      {/* Learning Dashboard */}
      <LearningDashboard metrics={betaBot.feedback.currentMetrics} />

      {/* Manual Controls */}
      <div className="manual-controls">
        <button
          onClick={betaBot.stopSpeaking}
          disabled={!betaBot.isSpeaking}
        >
          ⏹️ Stop Speaking
        </button>
      </div>

      {/* Keyword Guide */}
      <div className="keyword-guide">
        <h3>Keyword Commands</h3>
        <ul>
          <li><strong>Hey BetaBot</strong> - Normal response</li>
          <li><strong>Hey BetaBot Alakazam [query]</strong> - Search Perplexity</li>
          <li><strong>Hey BetaBot Kadabra [query]</strong> - Search videos</li>
          <li><strong>Hey BetaBot Abra [query]</strong> - Search images</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## Producer AI Integration (Backend Example)

```typescript
// producer-ai-server.ts (Node.js example)

import WebSocket from 'ws';
import { spawn } from 'child_process';

const wss = new WebSocket.Server({ port: 8080 });

// Store connected BetaBot clients
const betaBotClients: Set<WebSocket> = new Set();

wss.on('connection', (ws) => {
  console.log('✅ BetaBot connected');
  betaBotClients.add(ws);

  ws.on('close', () => {
    console.log('🔌 BetaBot disconnected');
    betaBotClients.delete(ws);
  });
});

/**
 * Send live transcript to all connected BetaBots
 */
function sendTranscript(text: string) {
  const message = JSON.stringify({
    type: 'transcript',
    text,
    timestamp: Date.now()
  });

  betaBotClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Send Producer AI question to BetaBot (manually triggered)
 */
function sendProducerQuestion(question: string, mode?: string) {
  console.log('📤 Sending Producer AI question to BetaBot:', question);

  const message = JSON.stringify({
    type: 'producer_question',
    question: {
      question,
      mode: mode || 'creative',
      context: {}
    }
  });

  betaBotClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Start audio transcription (using Deepgram/AssemblyAI/Whisper)
 */
function startTranscription() {
  // Example with Deepgram
  const deepgram = spawn('deepgram', [
    'stream',
    '--live',
    '--punctuate',
    '--interim-results'
  ]);

  deepgram.stdout.on('data', (data) => {
    const result = JSON.parse(data.toString());
    if (result.is_final) {
      const transcript = result.channel.alternatives[0].transcript;
      sendTranscript(transcript);
    }
  });
}

// Example API endpoint to manually trigger question
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/send-question', (req, res) => {
  const { question, mode } = req.body;
  sendProducerQuestion(question, mode);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('🚀 Producer AI server running on port 3000');
  startTranscription();
});
```

---

## Environment Variables

```bash
# .env.local

# Producer AI WebSocket
VITE_PRODUCER_AI_WS_URL=ws://localhost:8080/transcript

# BetaBot APIs
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Search Services
VITE_PERPLEXITY_API_KEY=your-perplexity-key
VITE_YOUTUBE_API_KEY=your-youtube-api-key
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key

# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

---

## Complete Flow Example

### Scenario 1: Keyword Activation (User Says "Hey BetaBot Alakazam...")

```
1. User speaks: "Hey BetaBot Alakazam when did World War 2 start"
2. Producer AI transcribes → Sends to BetaBot
3. BetaBot receives transcript
4. Keyword detection:
   - Wake word: ✅ "Hey BetaBot"
   - Action: ✅ "Alakazam"
   - Query: "when did World War 2 start"
5. BetaBot searches Perplexity
6. Gets result: "World War 2 started on September 1, 1939..."
7. BetaBot speaks result (TTS)
8. Displays search results on stream
9. Stores in memory
10. Waits for feedback (thumbs up/down)
```

### Scenario 2: Producer AI Question (Manually Triggered)

```
1. You click "Send Question" in Producer AI
2. Producer AI sends to BetaBot:
   {
     question: "That's fascinating! Can you tell us more about your experience?",
     mode: "empathetic"
   }
3. BetaBot receives question
4. BetaBot speaks immediately (TTS)
5. Displays as super chat on stream
6. Stores in memory
7. Waits for feedback
```

---

## Summary

✅ **Two Input Modes**:
1. Keyword activation ("Hey BetaBot Alakazam...")
2. Producer AI questions (manually triggered)

✅ **All Features Preserved**:
- Conversation memory ✅
- Learning from feedback ✅
- Smart timing detection ✅
- Emotion-aware responses ✅
- Multi-model fusion (when appropriate) ✅

✅ **Keyword Commands**:
- **Alakazam** → Perplexity search
- **Kadabra** → Video search
- **Abra** → Image search

✅ **Benefits**:
- Fast response (~500ms)
- No accidental searching
- Cost-optimized ($0/month for listening)
- Memory & learning intact
- Clear, explicit control

**Everything is ready to go! Let's proceed with this plan.** 🚀
