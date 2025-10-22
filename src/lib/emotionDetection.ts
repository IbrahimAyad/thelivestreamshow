/**
 * Emotion Detection with Hume AI
 *
 * Analyzes audio for emotions and maps them to BetaBot conversation modes
 */

import { BetaBotMode } from '../hooks/useBetaBotConversation';

export interface EmotionScore {
  emotion: string;
  score: number; // 0-1
}

export interface EmotionAnalysisResult {
  topEmotions: EmotionScore[];
  dominantEmotion: string;
  emotionalValence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to excited)
  confidence: number; // 0-1
  timestamp: number;
}

export interface MoodMapping {
  recommendedMode: BetaBotMode;
  confidence: number;
  reasoning: string;
  emotionContext: {
    dominantEmotion: string;
    valence: number;
    arousal: number;
  };
}

/**
 * Analyze audio with Hume AI
 */
export async function analyzeEmotionFromAudio(
  audioBlob: Blob
): Promise<EmotionAnalysisResult | null> {
  const apiKey = import.meta.env.VITE_HUME_AI_API_KEY;

  if (!apiKey) {
    console.warn('Hume AI API key not configured, skipping emotion detection');
    return null;
  }

  try {
    console.log('🎭 Analyzing emotion with Hume AI...');

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('models', JSON.stringify({
      prosody: {}  // Voice prosody analysis
    }));

    const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hume AI API error:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Hume AI response:', data);

    // Parse Hume AI response
    return parseHumeResponse(data);

  } catch (error) {
    console.error('Error analyzing emotion:', error);
    return null;
  }
}

/**
 * Parse Hume AI response and extract emotion data
 */
function parseHumeResponse(data: any): EmotionAnalysisResult | null {
  try {
    // Hume AI returns predictions for each time window
    const predictions = data.results?.predictions?.prosody || [];

    if (predictions.length === 0) {
      return null;
    }

    // Get the most recent prediction
    const latestPrediction = predictions[predictions.length - 1];
    const emotions = latestPrediction.emotions || [];

    // Sort emotions by score (descending)
    const sortedEmotions = emotions
      .map((e: any) => ({
        emotion: e.name,
        score: e.score
      }))
      .sort((a: EmotionScore, b: EmotionScore) => b.score - a.score);

    // Get top 5 emotions
    const topEmotions = sortedEmotions.slice(0, 5);

    // Calculate valence (positive vs negative emotions)
    const valence = calculateValence(sortedEmotions);

    // Calculate arousal (calm vs excited)
    const arousal = calculateArousal(sortedEmotions);

    return {
      topEmotions,
      dominantEmotion: topEmotions[0]?.emotion || 'neutral',
      emotionalValence: valence,
      arousal,
      confidence: topEmotions[0]?.score || 0,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error parsing Hume AI response:', error);
    return null;
  }
}

/**
 * Calculate emotional valence from emotion scores
 * Returns -1 (negative) to 1 (positive)
 */
function calculateValence(emotions: EmotionScore[]): number {
  const positiveEmotions = ['joy', 'contentment', 'amusement', 'excitement', 'satisfaction', 'admiration'];
  const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust', 'anxiety', 'disappointment', 'frustration'];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const emotion of emotions) {
    if (positiveEmotions.includes(emotion.emotion.toLowerCase())) {
      positiveScore += emotion.score;
    } else if (negativeEmotions.includes(emotion.emotion.toLowerCase())) {
      negativeScore += emotion.score;
    }
  }

  // Normalize to -1 to 1
  const total = positiveScore + negativeScore;
  if (total === 0) return 0;

  return (positiveScore - negativeScore) / total;
}

/**
 * Calculate arousal level from emotion scores
 * Returns 0 (calm) to 1 (excited)
 */
function calculateArousal(emotions: EmotionScore[]): number {
  const highArousalEmotions = ['excitement', 'anger', 'fear', 'surprise', 'anxiety', 'enthusiasm'];
  const lowArousalEmotions = ['calmness', 'contentment', 'sadness', 'boredom', 'tiredness'];

  let highArousalScore = 0;
  let lowArousalScore = 0;

  for (const emotion of emotions) {
    const emotionLower = emotion.emotion.toLowerCase();
    if (highArousalEmotions.includes(emotionLower)) {
      highArousalScore += emotion.score;
    } else if (lowArousalEmotions.includes(emotionLower)) {
      lowArousalScore += emotion.score;
    }
  }

  // Normalize to 0 to 1
  const total = highArousalScore + lowArousalScore;
  if (total === 0) return 0.5; // Default to medium arousal

  return highArousalScore / total;
}

/**
 * Map emotion analysis to BetaBot conversation mode
 */
export function mapEmotionToMode(analysis: EmotionAnalysisResult): MoodMapping {
  const { dominantEmotion, emotionalValence, arousal, confidence } = analysis;

  let recommendedMode: BetaBotMode = 'creative'; // default
  let reasoning = '';
  let mappingConfidence = confidence;

  // High energy + positive = Creative/Excited mode
  if (arousal > 0.6 && emotionalValence > 0.3) {
    recommendedMode = 'creative';
    reasoning = `Host is energetic and positive (${dominantEmotion}). Using creative mode for dynamic engagement.`;
  }
  // Low energy + positive = Professional/Calm mode
  else if (arousal < 0.4 && emotionalValence > 0.2) {
    recommendedMode = 'professional';
    reasoning = `Host is calm and positive (${dominantEmotion}). Using professional mode for thoughtful discussion.`;
  }
  // Negative emotions = Empathetic mode
  else if (emotionalValence < -0.2) {
    recommendedMode = 'empathetic';
    reasoning = `Detected negative emotion (${dominantEmotion}). Using empathetic mode for supportive responses.`;
  }
  // High energy + negative = De-escalate with Professional mode
  else if (arousal > 0.6 && emotionalValence < 0) {
    recommendedMode = 'professional';
    reasoning = `High arousal with negative emotion (${dominantEmotion}). Using professional mode to de-escalate.`;
  }
  // Uncertain/Mixed emotions = Balanced Creative mode
  else {
    recommendedMode = 'creative';
    reasoning = `Mixed or neutral emotions (${dominantEmotion}). Using creative mode for balanced engagement.`;
    mappingConfidence *= 0.7; // Lower confidence for mixed emotions
  }

  return {
    recommendedMode,
    confidence: mappingConfidence,
    reasoning,
    emotionContext: {
      dominantEmotion,
      valence: emotionalValence,
      arousal
    }
  };
}

/**
 * Lightweight emotion detection from text (fallback when audio analysis not available)
 * Uses simple keyword matching
 */
export function detectEmotionFromText(text: string): EmotionAnalysisResult {
  const lowerText = text.toLowerCase();

  // Define emotion keywords
  const emotionKeywords = {
    joy: ['happy', 'great', 'awesome', 'amazing', 'love', 'excellent', 'wonderful', 'fantastic'],
    excitement: ['excited', 'wow', 'incredible', 'unbelievable', 'omg', 'yes!'],
    anger: ['angry', 'mad', 'furious', 'pissed', 'annoyed', 'frustrated', 'damn'],
    sadness: ['sad', 'depressed', 'down', 'unhappy', 'upset', 'terrible', 'awful'],
    fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'concerned'],
    surprise: ['surprise', 'shocked', 'unexpected', 'whoa', 'really?'],
    neutral: ['okay', 'fine', 'alright', 'sure', 'yes', 'no']
  };

  // Count matches for each emotion
  const emotionScores: EmotionScore[] = [];

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 0.1;
      }
    }
    if (score > 0) {
      emotionScores.push({ emotion, score: Math.min(score, 1) });
    }
  }

  // Sort by score
  emotionScores.sort((a, b) => b.score - a.score);

  // Default to neutral if no emotions detected
  if (emotionScores.length === 0) {
    emotionScores.push({ emotion: 'neutral', score: 0.5 });
  }

  // Calculate valence and arousal from detected emotions
  const valence = calculateValence(emotionScores);
  const arousal = calculateArousal(emotionScores);

  return {
    topEmotions: emotionScores.slice(0, 5),
    dominantEmotion: emotionScores[0].emotion,
    emotionalValence: valence,
    arousal,
    confidence: emotionScores[0].score,
    timestamp: Date.now()
  };
}
