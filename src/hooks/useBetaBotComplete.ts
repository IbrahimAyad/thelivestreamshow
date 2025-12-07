/**
 * Complete BetaBot Hook - Production Ready
 *
 * Combines all features:
 * - Memory & learning
 * - Keyword activation
 * - Producer AI questions
 * - Search capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { detectKeywords, KeywordMatch } from '../lib/keywordDetection';
import { searchPerplexity, PerplexityResult } from '../lib/perplexitySearch';
import { searchVideos, VideoResult } from '../lib/videoSearch';
import { searchImages, ImageResult } from '../lib/imageSearch';
import { speakPerplexityAnswer, speakVideoResults, speakImageResults } from '../lib/elevenLabsStream';
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
  data?: PerplexityResult | VideoResult[] | ImageResult[] | ProducerAIQuestion;
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

  // Voice search handlers
  handlePerplexitySearch: (query: string) => Promise<BetaBotResponse>;
  handleVideoSearch: (query: string) => Promise<BetaBotResponse>;
  handleImageSearch: (query: string) => Promise<BetaBotResponse>;
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

  // Refs
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastProcessedRef = useRef<string>('');
  const lastTranscriptIdRef = useRef<string | null>(null);
  const lastQuestionIdRef = useRef<string | null>(null);

  /**
   * Subscribe to Supabase for live transcripts and Producer AI questions
   */
  useEffect(() => {
    console.log('🔌 Subscribing to Supabase for transcripts and questions...');

    // Subscribe to new transcripts
    const transcriptChannel = supabase
      .channel('betabot_transcripts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'betabot_conversation_log'
      }, (payload) => {
        const newTranscript = payload.new as any;

        // Avoid duplicate processing
        if (lastTranscriptIdRef.current === newTranscript.id) {
          return;
        }
        lastTranscriptIdRef.current = newTranscript.id;

        console.log('📨 New transcript:', newTranscript.transcript_text?.substring(0, 50) + '...');

        const transcriptText = newTranscript.transcript_text || '';
        setLiveTranscript(transcriptText);
        handleTranscriptUpdate(transcriptText);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to transcripts');
        }
      });

    // Subscribe to Producer AI questions
    const questionsChannel = supabase
      .channel('producer_questions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'show_questions'
      }, (payload) => {
        const newQuestion = payload.new as any;

        // Avoid duplicate processing
        if (lastQuestionIdRef.current === newQuestion.id) {
          return;
        }
        lastQuestionIdRef.current = newQuestion.id;

        // Only process questions from Producer AI (not manual/other sources)
        if (newQuestion.source === 'producer_ai' || newQuestion.ai_generated === true) {
          console.log('📨 Producer AI question:', newQuestion.question_text);

          speakProducerQuestion({
            question: newQuestion.question_text,
            mode: newQuestion.context_summary || 'creative',
            context: newQuestion
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to Producer AI questions');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from Supabase channels');
      transcriptChannel.unsubscribe();
      questionsChannel.unsubscribe();
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
    if (isProcessing || isSpeaking) {
      console.log('⏸️ Already processing or speaking, skipping');
      return;
    }

    const detection = detectKeywords(transcript);

    if (!detection.wakeWordDetected) {
      return;
    }

    // Prevent duplicate processing
    const detectionKey = `${detection.actionKeyword}-${detection.query}`;
    if (lastProcessedRef.current === detectionKey) {
      return;
    }
    lastProcessedRef.current = detectionKey;

    console.log('👋 Wake word detected!');
    console.log('🎯 Action:', detection.actionKeyword || 'normal response');
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
      // Clear after 5 seconds to allow same query again
      setTimeout(() => {
        lastProcessedRef.current = '';
      }, 5000);
    }
  }, [isProcessing, isSpeaking]);

  /**
   * Handle Perplexity search (Alakazam)
   */
  const handlePerplexitySearch = async (query: string): Promise<BetaBotResponse> => {
    console.log('🔍 Alakazam! Searching Perplexity...');

    const result = await searchPerplexity(query);
    const interactionId = crypto.randomUUID();

    await conversation.storeConversationMemory(
      interactionId,
      `User asked for search: "${query}". BetaBot found: ${result.answer}`,
      { contextMetadata: { type: 'perplexity_search', query } }
    );

    // Speak the answer with streaming TTS
    try {
      await speakPerplexityAnswer(result.answer);
      console.log('✅ Speaking Perplexity answer with streaming TTS');
    } catch (error) {
      console.error('❌ Failed to speak answer:', error);
    }

    // Trigger overlay display
    try {
      const insertData = {
        search_query: query,
        content_type: 'images', // Perplexity uses images type for AI search
        is_visible: true,
        session_id: null,
        metadata: {
          answer: result.answer,
          sources: result.sources,
          searchType: 'perplexity'
        }
      };
      console.log('🎯 Inserting into betabot_media_browser:', insertData);

      const { data, error } = await supabase.from('betabot_media_browser').insert(insertData).select();

      if (error) {
        console.error('❌ Database insert error:', error);
      } else {
        console.log('✅ Triggered Perplexity search overlay - Insert successful:', data);
      }
    } catch (error) {
      console.error('❌ Failed to trigger overlay:', error);
    }

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
      { contextMetadata: { type: 'video_search', query } }
    );

    // Speak the result with streaming TTS
    try {
      await speakVideoResults(query, videos.length);
      console.log('✅ Speaking video results with streaming TTS');
    } catch (error) {
      console.error('❌ Failed to speak results:', error);
    }

    // Trigger overlay display
    try {
      const insertData = {
        search_query: query,
        content_type: 'videos',
        is_visible: true,
        session_id: null,
        metadata: {
          videoCount: videos.length,
          searchType: 'youtube'
        }
      };
      console.log('🎯 Inserting into betabot_media_browser:', insertData);

      const { data, error } = await supabase.from('betabot_media_browser').insert(insertData).select();

      if (error) {
        console.error('❌ Database insert error:', error);
      } else {
        console.log('✅ Triggered video search overlay - Insert successful:', data);
      }
    } catch (error) {
      console.error('❌ Failed to trigger overlay:', error);
    }

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
      { contextMetadata: { type: 'image_search', query } }
    );

    // Speak the result with streaming TTS
    try {
      await speakImageResults(query, images.length);
      console.log('✅ Speaking image results with streaming TTS');
    } catch (error) {
      console.error('❌ Failed to speak results:', error);
    }

    // Trigger overlay display
    try {
      const insertData = {
        search_query: query,
        content_type: 'images',
        is_visible: true,
        session_id: null,
        metadata: {
          imageCount: images.length,
          searchType: 'unsplash'
        }
      };
      console.log('🎯 Inserting into betabot_media_browser:', insertData);

      const { data, error } = await supabase.from('betabot_media_browser').insert(insertData).select();

      if (error) {
        console.error('❌ Database insert error:', error);
      } else {
        console.log('✅ Triggered image search overlay - Insert successful:', data);
      }
    } catch (error) {
      console.error('❌ Failed to trigger overlay:', error);
    }

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
      console.log(`🎭 Using ${mode} mode (emotion: ${emotion.emotionAnalysis.dominantEmotion})`);
    }

    // Use conversation system with memory recall
    const result = await conversation.chat(query, mode as any);

    return {
      text: result,
      type: 'normal',
      interactionId: crypto.randomUUID(),
      source: 'keyword'
    };
  };

  /**
   * Speak Producer AI question (manually triggered)
   */
  const speakProducerQuestion = useCallback(async (questionData: ProducerAIQuestion) => {
    console.log('📨 Received Producer AI question:', questionData.question);

    const interactionId = crypto.randomUUID();

    await conversation.storeConversationMemory(
      interactionId,
      `Producer AI suggested: "${questionData.question}". BetaBot read it out loud.`,
      { contextMetadata: { type: 'producer_question', mode: questionData.mode } }
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

    return new Promise((resolve) => {
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
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('❌ TTS error:', error);
        setIsSpeaking(false);
        resolve();
      };

      speechSynthRef.current = utterance;
      speechSynthesis.speak(utterance);

      // Display on stream
      displayOnStream(response);
    });
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
   * Display response on stream (custom event for overlay)
   */
  const displayOnStream = (response: BetaBotResponse) => {
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
    stopSpeaking,
    // Voice search handlers
    handlePerplexitySearch,
    handleVideoSearch,
    handleImageSearch
  };
}
