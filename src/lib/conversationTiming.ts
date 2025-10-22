/**
 * Conversation Timing Analysis
 *
 * Detects optimal moments for BetaBot to interject based on:
 * - Silence detection (natural pauses)
 * - Topic shift detection (conversation transitions)
 * - Energy/pace detection (speaking rate and intensity)
 */

import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface TimingSignal {
  type: 'silence' | 'topic_shift' | 'energy_change' | 'natural_pause';
  confidence: number; // 0-1
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ConversationSegment {
  text: string;
  timestamp: number;
  duration?: number; // milliseconds
  wordCount?: number;
}

export interface EnergyMetrics {
  pace: 'slow' | 'normal' | 'fast' | 'very_fast';
  intensity: 'low' | 'medium' | 'high';
  wordsPerMinute: number;
  exclamationCount: number;
  questionCount: number;
}

/**
 * Silence Detection
 * Detects pauses in speech based on transcript timing
 */
export class SilenceDetector {
  private lastTranscriptTime: number = 0;
  private silenceThreshold: number;
  private minSilenceDuration: number;

  constructor(
    silenceThreshold: number = 3000, // 3 seconds default
    minSilenceDuration: number = 2000 // 2 seconds minimum
  ) {
    this.silenceThreshold = silenceThreshold;
    this.minSilenceDuration = minSilenceDuration;
  }

  /**
   * Update with new transcript and check for silence
   */
  detectSilence(currentTime: number = Date.now()): TimingSignal | null {
    if (this.lastTranscriptTime === 0) {
      this.lastTranscriptTime = currentTime;
      return null;
    }

    const silenceDuration = currentTime - this.lastTranscriptTime;

    if (silenceDuration >= this.silenceThreshold) {
      const confidence = Math.min(silenceDuration / (this.silenceThreshold * 2), 1);

      return {
        type: 'silence',
        confidence,
        timestamp: currentTime,
        metadata: {
          silenceDuration,
          lastSpeechTime: this.lastTranscriptTime
        }
      };
    }

    return null;
  }

  /**
   * Reset silence timer when new transcript arrives
   */
  onTranscript(timestamp: number = Date.now()) {
    this.lastTranscriptTime = timestamp;
  }

  reset() {
    this.lastTranscriptTime = 0;
  }
}

/**
 * Topic Shift Detection
 * Uses semantic similarity to detect topic changes
 */
export class TopicShiftDetector {
  private recentSegments: ConversationSegment[] = [];
  private maxSegments: number;
  private shiftThreshold: number;
  private cachedEmbeddings: Map<string, number[]> = new Map();

  constructor(
    maxSegments: number = 5,
    shiftThreshold: number = 0.6 // Lower = more different topics
  ) {
    this.maxSegments = maxSegments;
    this.shiftThreshold = shiftThreshold;
  }

  /**
   * Detect if new segment represents a topic shift
   */
  async detectTopicShift(newSegment: ConversationSegment): Promise<TimingSignal | null> {
    // Need at least 2 segments to compare
    if (this.recentSegments.length === 0) {
      this.addSegment(newSegment);
      return null;
    }

    try {
      // Get embedding for new segment
      const newEmbedding = await this.getEmbedding(newSegment.text);

      // Compare with recent segments (weighted by recency)
      const similarities: number[] = [];
      for (let i = this.recentSegments.length - 1; i >= 0; i--) {
        const segment = this.recentSegments[i];
        const embedding = await this.getEmbedding(segment.text);
        const similarity = cosineSimilarity(newEmbedding, embedding);

        // Weight more recent segments higher
        const recencyWeight = (i + 1) / this.recentSegments.length;
        similarities.push(similarity * recencyWeight);
      }

      // Average similarity to recent conversation
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      // Topic shift if similarity is below threshold
      if (avgSimilarity < this.shiftThreshold) {
        const confidence = 1 - avgSimilarity; // Lower similarity = higher confidence of shift

        this.addSegment(newSegment);

        return {
          type: 'topic_shift',
          confidence,
          timestamp: newSegment.timestamp,
          metadata: {
            previousTopicSimilarity: avgSimilarity,
            segmentText: newSegment.text.substring(0, 100)
          }
        };
      }

      this.addSegment(newSegment);
      return null;

    } catch (error) {
      console.error('Error detecting topic shift:', error);
      this.addSegment(newSegment);
      return null;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.cachedEmbeddings.has(text)) {
      return this.cachedEmbeddings.get(text)!;
    }

    // Generate new embedding
    const embedding = await generateEmbedding(text);
    this.cachedEmbeddings.set(text, embedding);

    // Limit cache size
    if (this.cachedEmbeddings.size > 20) {
      const firstKey = this.cachedEmbeddings.keys().next().value;
      this.cachedEmbeddings.delete(firstKey);
    }

    return embedding;
  }

  private addSegment(segment: ConversationSegment) {
    this.recentSegments.push(segment);

    // Keep only recent segments
    if (this.recentSegments.length > this.maxSegments) {
      this.recentSegments.shift();
    }
  }

  reset() {
    this.recentSegments = [];
    this.cachedEmbeddings.clear();
  }
}

/**
 * Energy and Pace Detection
 * Analyzes speaking rate and intensity
 */
export class EnergyDetector {
  private recentMetrics: EnergyMetrics[] = [];
  private maxHistory: number = 10;

  /**
   * Analyze energy from text segment
   */
  analyzeEnergy(segment: ConversationSegment): EnergyMetrics {
    const text = segment.text;
    const duration = segment.duration || 5000; // Default 5 seconds
    const wordCount = segment.wordCount || text.split(/\s+/).filter(w => w.length > 0).length;

    // Calculate words per minute
    const wordsPerMinute = (wordCount / duration) * 60000;

    // Detect intensity markers
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;
    const capsCount = (text.match(/[A-Z]{2,}/g) || []).length;
    const intensityWords = this.countIntensityWords(text);

    // Determine pace
    let pace: 'slow' | 'normal' | 'fast' | 'very_fast' = 'normal';
    if (wordsPerMinute < 100) pace = 'slow';
    else if (wordsPerMinute > 180) pace = 'very_fast';
    else if (wordsPerMinute > 140) pace = 'fast';

    // Determine intensity
    const intensityScore = exclamationCount * 2 + questionCount + capsCount + intensityWords;
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    if (intensityScore === 0) intensity = 'low';
    else if (intensityScore > 3) intensity = 'high';

    const metrics: EnergyMetrics = {
      pace,
      intensity,
      wordsPerMinute,
      exclamationCount,
      questionCount
    };

    this.recentMetrics.push(metrics);
    if (this.recentMetrics.length > this.maxHistory) {
      this.recentMetrics.shift();
    }

    return metrics;
  }

  /**
   * Detect significant energy changes
   */
  detectEnergyChange(currentMetrics: EnergyMetrics): TimingSignal | null {
    if (this.recentMetrics.length < 3) return null;

    // Get average of previous metrics
    const previousMetrics = this.recentMetrics.slice(0, -1);
    const avgWPM = previousMetrics.reduce((sum, m) => sum + m.wordsPerMinute, 0) / previousMetrics.length;

    // Check for significant pace change
    const wpmDiff = Math.abs(currentMetrics.wordsPerMinute - avgWPM);
    const wpmChangePercent = wpmDiff / avgWPM;

    // Detect transition from high energy to low energy (good time to ask question)
    const wasHighEnergy = previousMetrics[previousMetrics.length - 1].intensity === 'high' ||
                          previousMetrics[previousMetrics.length - 1].pace === 'very_fast';
    const isNowCalm = currentMetrics.intensity === 'low' || currentMetrics.pace === 'slow';

    if (wasHighEnergy && isNowCalm) {
      return {
        type: 'energy_change',
        confidence: 0.8,
        timestamp: Date.now(),
        metadata: {
          change: 'high_to_low',
          previousPace: previousMetrics[previousMetrics.length - 1].pace,
          currentPace: currentMetrics.pace
        }
      };
    }

    // Detect significant pace slowdown (might indicate wrapping up a point)
    if (wpmChangePercent > 0.3 && currentMetrics.wordsPerMinute < avgWPM) {
      return {
        type: 'energy_change',
        confidence: 0.6,
        timestamp: Date.now(),
        metadata: {
          change: 'pace_slowdown',
          previousWPM: avgWPM,
          currentWPM: currentMetrics.wordsPerMinute
        }
      };
    }

    return null;
  }

  private countIntensityWords(text: string): number {
    const intensityWords = [
      'amazing', 'incredible', 'awesome', 'wow', 'unbelievable',
      'crazy', 'insane', 'literally', 'absolutely', 'definitely',
      'really', 'very', 'super', 'extremely', 'totally'
    ];

    const lowerText = text.toLowerCase();
    return intensityWords.filter(word => lowerText.includes(word)).length;
  }

  getCurrentEnergy(): EnergyMetrics | null {
    return this.recentMetrics[this.recentMetrics.length - 1] || null;
  }

  getAverageEnergy(): EnergyMetrics | null {
    if (this.recentMetrics.length === 0) return null;

    const avgWPM = this.recentMetrics.reduce((sum, m) => sum + m.wordsPerMinute, 0) / this.recentMetrics.length;
    const avgExclamations = this.recentMetrics.reduce((sum, m) => sum + m.exclamationCount, 0) / this.recentMetrics.length;
    const avgQuestions = this.recentMetrics.reduce((sum, m) => sum + m.questionCount, 0) / this.recentMetrics.length;

    let pace: 'slow' | 'normal' | 'fast' | 'very_fast' = 'normal';
    if (avgWPM < 100) pace = 'slow';
    else if (avgWPM > 180) pace = 'very_fast';
    else if (avgWPM > 140) pace = 'fast';

    const intensityScore = avgExclamations * 2 + avgQuestions;
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    if (intensityScore === 0) intensity = 'low';
    else if (intensityScore > 2) intensity = 'high';

    return {
      pace,
      intensity,
      wordsPerMinute: avgWPM,
      exclamationCount: avgExclamations,
      questionCount: avgQuestions
    };
  }

  reset() {
    this.recentMetrics = [];
  }
}

/**
 * Natural Pause Detection
 * Detects sentence-ending patterns that indicate good interruption points
 */
export function detectNaturalPause(text: string): TimingSignal | null {
  const trimmed = text.trim();

  // Sentence endings
  const endsWithPeriod = /\.$/.test(trimmed);
  const endsWithQuestion = /\?$/.test(trimmed);
  const endsWithExclamation = /!$/.test(trimmed);

  // Transitional phrases that indicate pause points
  const transitionPhrases = [
    'anyway',
    'so',
    'moving on',
    'next',
    'also',
    'furthermore',
    'another thing',
    'by the way',
    'speaking of which',
    'that said',
    'in any case'
  ];

  const lowerText = trimmed.toLowerCase();
  const hasTransition = transitionPhrases.some(phrase => lowerText.includes(phrase));

  // Calculate confidence
  let confidence = 0;
  if (endsWithPeriod) confidence += 0.4;
  if (endsWithQuestion) confidence += 0.5; // Questions are good pause points
  if (endsWithExclamation) confidence += 0.3;
  if (hasTransition) confidence += 0.4;

  // Need at least some indication of pause
  if (confidence >= 0.4) {
    return {
      type: 'natural_pause',
      confidence: Math.min(confidence, 1),
      timestamp: Date.now(),
      metadata: {
        endsWithPeriod,
        endsWithQuestion,
        hasTransition,
        lastWords: trimmed.split(/\s+/).slice(-5).join(' ')
      }
    };
  }

  return null;
}

/**
 * Combined Timing Analyzer
 * Orchestrates all timing detection methods
 */
export class ConversationTimingAnalyzer {
  private silenceDetector: SilenceDetector;
  private topicShiftDetector: TopicShiftDetector;
  private energyDetector: EnergyDetector;

  constructor(config?: {
    silenceThreshold?: number;
    topicShiftThreshold?: number;
  }) {
    this.silenceDetector = new SilenceDetector(
      config?.silenceThreshold || 3000
    );
    this.topicShiftDetector = new TopicShiftDetector(
      5,
      config?.topicShiftThreshold || 0.6
    );
    this.energyDetector = new EnergyDetector();
  }

  /**
   * Analyze new transcript segment for timing signals
   */
  async analyzeSegment(segment: ConversationSegment): Promise<TimingSignal[]> {
    const signals: TimingSignal[] = [];

    // Reset silence timer on new transcript
    this.silenceDetector.onTranscript(segment.timestamp);

    // Check for natural pause in text
    const naturalPause = detectNaturalPause(segment.text);
    if (naturalPause) {
      signals.push(naturalPause);
    }

    // Analyze energy and pace
    const energyMetrics = this.energyDetector.analyzeEnergy(segment);
    const energyChange = this.energyDetector.detectEnergyChange(energyMetrics);
    if (energyChange) {
      signals.push(energyChange);
    }

    // Check for topic shifts (async)
    const topicShift = await this.topicShiftDetector.detectTopicShift(segment);
    if (topicShift) {
      signals.push(topicShift);
    }

    return signals;
  }

  /**
   * Check for silence (call this periodically)
   */
  checkSilence(): TimingSignal | null {
    return this.silenceDetector.detectSilence();
  }

  /**
   * Get current conversation energy
   */
  getCurrentEnergy(): EnergyMetrics | null {
    return this.energyDetector.getCurrentEnergy();
  }

  /**
   * Calculate overall "should interrupt" score
   * Returns 0-1 score where 1 = definitely interrupt
   */
  calculateInterruptionScore(signals: TimingSignal[]): number {
    if (signals.length === 0) return 0;

    // Weight different signal types
    const weights = {
      silence: 0.4,
      topic_shift: 0.3,
      natural_pause: 0.3,
      energy_change: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      const weight = weights[signal.type];
      totalScore += signal.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  reset() {
    this.silenceDetector.reset();
    this.topicShiftDetector.reset();
    this.energyDetector.reset();
  }
}
