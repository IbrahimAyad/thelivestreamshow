# 🎬 Producer AI + BetaBot Architecture

## The Problem

You have **TWO AIs competing**:
1. Producer/Director AI - Listens to stream, generates questions
2. BetaBot - Also trying to listen and decide when to speak

**Result**:
- Slow response times
- BetaBot searching mid-conversation
- Accidental interruptions
- Redundant processing

---

## ✅ SOLUTION: Two-Tier Architecture

### Tier 1: Producer AI (Strategic Brain - Slow & Thoughtful)

**Role**: Listen, analyze, decide, generate questions

```
Stream Audio
    ↓
Producer AI (runs continuously)
    ↓
├─ Smart Emotion Detection (every 2 min)
├─ Conversation Timing Analysis
├─ Memory Recall
└─ Multi-Model Fusion (research)
    ↓
Generates question package:
{
  question: "That's interesting! How did you...",
  mode: "creative",              // Based on host emotion
  context: { ... },              // Memory context
  timing: { confidence: 0.85 },  // Timing analysis
  shouldSpeak: true
}
    ↓
Backend
```

### Tier 2: BetaBot (Fast Speaker - Immediate Execution)

**Role**: Receive question, speak it immediately

```
Backend pushes message
    ↓
BetaBot receives:
{
  question: "That's interesting! How did you...",
  mode: "creative",
  tts_settings: { voice: "enthusiastic" }
}
    ↓
BetaBot (NO analysis, NO searching, NO decision making)
    ↓
├─ Speak immediately (TTS)
└─ Display as super chat
    ↓
Done! (under 1 second)
```

---

## Code Implementation

### Producer AI (Backend Service)

```typescript
// producer-ai.ts - Runs on backend, monitors stream

import { useSmartEmotionDetection } from './hooks/useSmartEmotionDetection';
import { useConversationTiming } from './hooks/useConversationTiming';
import { useBetaBotConversationWithMemory } from './hooks/useBetaBotConversationWithMemory';
import { mapEmotionToMode } from './lib/emotionDetection';

class ProducerAI {
  private emotion = useSmartEmotionDetection({
    voiceSampleInterval: 120,  // Every 2 minutes
    voiceSampleDuration: 5,
    checkBeforeSpeaking: false  // We'll check manually
  });

  private timing = useConversationTiming();
  private conversation = useBetaBotConversationWithMemory();

  async start() {
    console.log('🎬 Producer AI starting...');
    await this.emotion.startSmartDetection();

    // Monitor transcript continuously
    this.subscribeToTranscript();

    // Check every 30 seconds if we should ask a question
    setInterval(() => this.checkIfShouldAsk(), 30000);
  }

  private subscribeToTranscript() {
    // Subscribe to live transcript
    transcriptStream.on('update', (text) => {
      // Analyze with FREE text-based emotion
      this.emotion.analyzeText(text);

      // Analyze timing
      this.timing.analyzeTranscript(text, Date.now());
    });
  }

  private async checkIfShouldAsk() {
    console.log('🤔 Producer AI checking if should ask question...');

    // Step 1: Check timing
    if (!this.timing.shouldInterrupt()) {
      console.log('⏱️ Bad timing, waiting...');
      return;
    }

    console.log('✅ Good timing detected');

    // Step 2: Get fresh voice emotion sample (3-5 seconds)
    await this.emotion.captureVoiceSample();
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mood = this.emotion.currentEmotion;
    if (!mood) {
      console.log('❌ No emotion data, skipping');
      return;
    }

    console.log(`🎭 Host mood: ${mood.dominantEmotion}`);

    // Step 3: Generate question with multi-model fusion
    const modeMapping = mapEmotionToMode(mood);
    const mode = modeMapping.recommendedMode;

    console.log(`🧠 Generating question in ${mode} mode...`);

    const result = await this.conversation.chatWithFusion(
      this.generateQuestionPrompt(),
      mode
    );

    // Step 4: Package and send to BetaBot
    const questionPackage = {
      question: result.response,
      mode: mode,
      emotion: {
        dominant: mood.dominantEmotion,
        valence: mood.emotionalValence,
        arousal: mood.arousal
      },
      tts_settings: this.getTTSSettings(mode, mood),
      metadata: {
        memoryRecallCount: result.memoryRecallCount,
        modelsUsed: this.conversation.lastMultiModelResponse?.modelsUsed
      }
    };

    console.log('📤 Sending to BetaBot:', questionPackage.question);

    // Send to backend
    await this.sendToBetaBot(questionPackage);
  }

  private getTTSSettings(mode: string, mood: any) {
    // Map mode + emotion to TTS voice settings
    if (mode === 'creative' && mood.arousal > 0.6) {
      return { voice: 'enthusiastic', speed: 1.1 };
    } else if (mode === 'empathetic') {
      return { voice: 'warm', speed: 0.9 };
    } else {
      return { voice: 'professional', speed: 1.0 };
    }
  }

  private generateQuestionPrompt(): string {
    // Generate prompt based on recent conversation
    return `Based on the current conversation, ask an engaging question...`;
  }

  private async sendToBetaBot(questionPackage: any) {
    // Send to backend API
    await fetch('/api/betabot/speak', {
      method: 'POST',
      body: JSON.stringify(questionPackage)
    });
  }
}

// Start Producer AI
const producer = new ProducerAI();
producer.start();
```

### BetaBot (Frontend - FAST Speaker Only)

```typescript
// BetaBotSpeaker.tsx - Frontend component

import { useState, useEffect } from 'react';

interface BetaBotMessage {
  question: string;
  mode: string;
  emotion: {
    dominant: string;
    valence: number;
    arousal: number;
  };
  tts_settings: {
    voice: string;
    speed: number;
  };
}

export function BetaBotSpeaker() {
  const [currentMessage, setCurrentMessage] = useState<BetaBotMessage | null>(null);

  useEffect(() => {
    // Listen for messages from backend
    const ws = new WebSocket('wss://your-backend.com/betabot');

    ws.onmessage = async (event) => {
      const message: BetaBotMessage = JSON.parse(event.data);

      console.log('📨 BetaBot received message:', message.question);
      console.log('🎭 Mode:', message.mode);
      console.log('🎤 Voice:', message.tts_settings.voice);

      // IMMEDIATELY speak it (no analysis, no searching)
      await speakMessage(message);

      // Display as super chat
      displayAsSuperChat(message);

      setCurrentMessage(message);
    };

    return () => ws.close();
  }, []);

  const speakMessage = async (message: BetaBotMessage) => {
    console.log('🔊 Speaking now...');

    // Use TTS with settings from Producer AI
    const utterance = new SpeechSynthesisUtterance(message.question);
    utterance.voice = getVoiceByName(message.tts_settings.voice);
    utterance.rate = message.tts_settings.speed;

    speechSynthesis.speak(utterance);

    // Also play through your TTS service if using one
    await playTTS(message.question, message.tts_settings);
  };

  const displayAsSuperChat = (message: BetaBotMessage) => {
    // Show as super chat overlay
    const superChatElement = document.createElement('div');
    superChatElement.className = 'super-chat betabot-message';
    superChatElement.innerHTML = `
      <div class="betabot-icon">🤖</div>
      <div class="betabot-text">${message.question}</div>
      <div class="betabot-emotion">${message.emotion.dominant}</div>
    `;
    document.body.appendChild(superChatElement);

    // Remove after 10 seconds
    setTimeout(() => superChatElement.remove(), 10000);
  };

  return (
    <div className="betabot-speaker">
      {currentMessage && (
        <div className="current-message">
          <div className="question">{currentMessage.question}</div>
          <div className="metadata">
            <span>Mode: {currentMessage.mode}</span>
            <span>Emotion: {currentMessage.emotion.dominant}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Separation of Concerns

| Feature | Producer AI | BetaBot |
|---------|-------------|---------|
| **Listen to stream** | ✅ Yes (continuous) | ❌ No |
| **Emotion detection** | ✅ Yes (smart sampling) | ❌ No |
| **Timing analysis** | ✅ Yes | ❌ No |
| **Memory recall** | ✅ Yes | ❌ No |
| **Multi-model fusion** | ✅ Yes | ❌ No |
| **Generate questions** | ✅ Yes | ❌ No |
| **Speak (TTS)** | ❌ No | ✅ Yes |
| **Display super chat** | ❌ No | ✅ Yes |
| **Feedback tracking** | ✅ Yes | 🤝 Both (UI on BetaBot) |

---

## Response Time Comparison

### Before (Everything in BetaBot)

```
Backend pushes message
    ↓
BetaBot receives
    ↓ 500ms - emotion analysis
    ↓ 1000ms - timing check
    ↓ 2000ms - multi-model fusion / searching
    ↓ 500ms - generate response
    ↓ 100ms - TTS
    ↓
Total: 4-5 seconds ❌
```

### After (Two-Tier Architecture)

```
Backend pushes message
    ↓
BetaBot receives
    ↓ 100ms - TTS
    ↓
Total: 100ms ✅
```

**50x faster response time!** 🚀

---

## Benefits

### ✅ Producer AI Benefits
- Can take its time (doesn't affect response time)
- Smart emotion detection (cost-optimized)
- Memory recall without slowing down BetaBot
- Multi-model fusion for better questions
- Timing analysis to avoid interruptions

### ✅ BetaBot Benefits
- **Instant response** (under 100ms)
- No searching mid-conversation
- No accidental interruptions
- Simple, focused job: speak
- Lower cost (no emotion detection needed)

### ✅ Overall Benefits
- No competing AI logic
- Clear separation of concerns
- Scalable (can run Producer AI on backend with better resources)
- Easier debugging (one place for each function)
- Better user experience (fast, consistent)

---

## Cost Implications

### Producer AI (Backend)
- Smart emotion detection: ~$0.06/month
- Multi-model fusion: ~$7/month
- Memory embeddings: ~$0.30/month
- **Total**: ~$7.36/month

### BetaBot (Frontend)
- TTS only: FREE or paid TTS service
- No emotion detection: $0
- No AI models: $0
- **Total**: $0 (or TTS service cost)

**Total system cost**: ~$7.36/month + TTS

---

## Migration Strategy

### Phase 1: Move Features to Producer AI
1. Move emotion detection to Producer AI
2. Move timing analysis to Producer AI
3. Move multi-model fusion to Producer AI

### Phase 2: Simplify BetaBot
1. Remove emotion detection from BetaBot
2. Remove timing logic from BetaBot
3. Remove multi-model fusion from BetaBot
4. Keep only: receive message → speak

### Phase 3: Test
1. Test Producer AI question generation
2. Test BetaBot response time (should be <200ms)
3. Test no more searching mid-conversation
4. Test no more accidental interruptions

---

## Example Flow

```
Producer AI (Backend):
  [00:00] Start monitoring stream
  [00:30] Analyze transcript with free text emotion
  [01:00] Capture 5-second voice sample
  [01:05] Detect: Joy + High arousal → Creative mode
  [01:10] Check timing: Good opportunity (silence detected)
  [01:15] Generate question with multi-model fusion
  [01:20] Question ready: "That's fascinating! How did you..."
  [01:20] Send to BetaBot

BetaBot (Frontend):
  [01:20.000] Receive message
  [01:20.100] Speak immediately
  [01:20.100] Show super chat
  [01:20.100] Done! ✅

Total time from decision to speech: 100ms
```

---

## Recommended Setup

### Producer AI Configuration
```typescript
const producerAI = new ProducerAI({
  emotion: {
    useVoiceDetection: true,
    voiceSampleInterval: 120,      // Every 2 minutes
    voiceSampleDuration: 5,        // 5 seconds
    checkBeforeSpeaking: true      // Always check before sending
  },
  timing: {
    minSilenceDuration: 2000,      // 2 seconds of silence
    minTimeBetweenQuestions: 60000 // 1 minute minimum
  },
  conversation: {
    mode: 'auto',                  // Auto-select based on emotion
    useMultiModel: true,           // Use GPT-4 + Claude + Perplexity
    memoryRecall: true             // Use conversation memory
  }
});
```

### BetaBot Configuration
```typescript
const betaBot = new BetaBotSpeaker({
  tts: 'elevenlabs',  // or your TTS service
  superChatDuration: 10000,  // 10 seconds
  autoSpeak: true     // Speak immediately when message received
});
```

---

## Summary

**Don't make BetaBot do everything!**

- **Producer AI**: Strategic brain (slow, thoughtful)
- **BetaBot**: Fast speaker (immediate execution)

This solves ALL your issues:
- ✅ Fast response time (100ms vs 4-5 seconds)
- ✅ No searching mid-conversation
- ✅ No accidental interruptions
- ✅ Cost-optimized emotion detection
- ✅ Clear separation of concerns

**Next step**: Implement Producer AI on backend, simplify BetaBot to speaker-only mode.
