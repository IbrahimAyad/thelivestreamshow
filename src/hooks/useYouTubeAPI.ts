import { useState, useCallback } from 'react';

// Popular channel mappings
export const POPULAR_CHANNELS: Record<string, string> = {
  // Podcasts
  'joe rogan': 'UCzQUP1qoWDoEbmsQxvdjxgQ',
  'jre': 'UCzQUP1qoWDoEbmsQxvdjxgQ',
  'lex fridman': 'UCSHZKyawb77ixDdsGog4iWA',

  // Tech
  'mkbhd': 'UCBJycsmduvYEL83R_U4JriQ',
  'marques brownlee': 'UCBJycsmduvYEL83R_U4JriQ',
  'linus tech tips': 'UCXuqSBlHAE6Xw-yeJA0Tunw',
  'mrwhosetheboss': 'UCMiJRAwDNSNzuYeN2uWa0pA',

  // Entertainment
  'mrbeast': 'UCX6OQ3DkcsbYNE6H8uQQuVA',
  'pewdiepie': 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',

  // Gaming
  'ninja': 'UCAW-NpUFkMyCNrvRSSGIvDQ',

  // Sports
  'espn': 'UCiWLfSweyRNmLpgEHekhoAg',

  // News
  'cnn': 'UCupvZG-5ko_eiXAupbDfxWw',
};

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  description: string;
}

export interface SearchOptions {
  type?: 'video' | 'short' | 'trending';
  sortBy?: 'relevance' | 'date' | 'viewCount';
  maxResults?: number;
  channelId?: string;
}

export interface UseYouTubeAPI {
  searchVideos: (query: string, options?: SearchOptions) => Promise<YouTubeVideo[]>;
  getTrending: (category?: string) => Promise<YouTubeVideo[]>;
  getChannelVideos: (channelId: string, maxResults?: number) => Promise<YouTubeVideo[]>;
  processQuery: (query: string) => SearchOptions & { cleanQuery: string };
  isLoading: boolean;
  error: string | null;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Content intent detection - what type of video content are they looking for?
interface ContentIntent {
  type: 'highlight' | 'interview' | 'review' | 'tutorial' | 'full_episode' | 'reaction' | 'breakdown' | 'general';
  keywords: string[];
}

const detectContentIntent = (query: string): ContentIntent => {
  const q = query.toLowerCase();

  // Highlights/Best moments
  if (q.match(/\b(highlight|best moment|top moment|best part|funniest|epic|crazy)\b/i)) {
    return { type: 'highlight', keywords: ['highlights', 'best moments', 'compilation'] };
  }

  // Interviews
  if (q.match(/\b(interview|conversation|talk|podcast|episode)\b/i)) {
    return { type: 'interview', keywords: ['interview', 'full episode', 'podcast'] };
  }

  // Reviews
  if (q.match(/\b(review|thoughts on|opinion|breakdown|analysis)\b/i)) {
    return { type: 'review', keywords: ['review', 'breakdown', 'analysis'] };
  }

  // Tutorials/How-to
  if (q.match(/\b(how to|tutorial|guide|learn|teach)\b/i)) {
    return { type: 'tutorial', keywords: ['tutorial', 'guide', 'how to'] };
  }

  // Full episodes
  if (q.match(/\b(full episode|complete|entire|whole)\b/i)) {
    return { type: 'full_episode', keywords: ['full episode', 'full podcast', 'complete'] };
  }

  // Reactions
  if (q.match(/\b(reacts?|reaction|responds?)\b/i)) {
    return { type: 'reaction', keywords: ['reaction', 'reacts to'] };
  }

  return { type: 'general', keywords: [] };
};

// Enrich query with context - add keywords that help find better content
const enrichQuery = (query: string, intent: ContentIntent): string => {
  let enriched = query;

  // Add intent-specific keywords if not already present
  const hasIntentKeyword = intent.keywords.some(kw => query.toLowerCase().includes(kw.toLowerCase()));
  if (!hasIntentKeyword && intent.keywords.length > 0) {
    enriched = `${query} ${intent.keywords[0]}`;
  }

  // Add quality indicators for podcast/interview content
  if (intent.type === 'interview' || intent.type === 'full_episode') {
    const channelDetected = detectChannel(query);
    if (channelDetected) {
      // If it's a known podcast channel, add quality keywords
      enriched += ' official';
    }
  }

  return enriched.trim();
};

// Quality score for filtering results
const calculateQualityScore = (video: any): number => {
  let score = 0;

  // View count (normalized, max 40 points)
  const views = parseInt(video.statistics?.viewCount || '0');
  if (views > 1000000) score += 40;
  else if (views > 100000) score += 30;
  else if (views > 10000) score += 20;
  else if (views > 1000) score += 10;

  // Like ratio (max 30 points)
  const likes = parseInt(video.statistics?.likeCount || '0');
  const dislikes = parseInt(video.statistics?.dislikeCount || '0');
  if (likes > 0) {
    const ratio = likes / (likes + dislikes + 1);
    score += Math.floor(ratio * 30);
  }

  // Comment count indicates engagement (max 15 points)
  const comments = parseInt(video.statistics?.commentCount || '0');
  if (comments > 1000) score += 15;
  else if (comments > 100) score += 10;
  else if (comments > 10) score += 5;

  // Channel verification/subscriber count (max 15 points)
  // Note: We don't have this data in basic search, but channel title can hint quality
  const channelTitle = video.snippet?.channelTitle?.toLowerCase() || '';
  if (Object.values(POPULAR_CHANNELS).includes(video.snippet?.channelId)) {
    score += 15; // Known quality channel
  }

  return score;
};

// Smart query processing functions
const detectContentType = (query: string): 'short' | 'video' | 'trending' => {
  if (query.match(/\b(shorts?|clips?)\b/i)) return 'short';
  if (query.match(/\b(trending|viral|popular)\b/i)) return 'trending';
  return 'video';
};

const detectChannel = (query: string): string | null => {
  const normalized = query.toLowerCase();
  for (const [name, id] of Object.entries(POPULAR_CHANNELS)) {
    if (normalized.includes(name)) return id;
  }
  return null;
};

const detectSortOrder = (query: string): 'date' | 'viewCount' | 'relevance' => {
  if (query.match(/\b(latest|recent|new)\b/i)) return 'date';
  if (query.match(/\b(popular|most viewed|top)\b/i)) return 'viewCount';
  return 'relevance';
};

export function useYouTubeAPI(): UseYouTubeAPI {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processQuery = useCallback((query: string) => {
    const type = detectContentType(query);
    const channelId = detectChannel(query);
    const sortBy = detectSortOrder(query);
    const intent = detectContentIntent(query);

    // Clean query by removing filler words and bot references
    let cleanQuery = query
      .replace(/\b(hey|hi|hello|beta\s*bot|bot|betabot)\b/gi, '') // Remove greetings and bot mentions
      .replace(/\b(can you|could you|please|show me|find|search for|pull up|look up|get me)\b/gi, '') // Remove request phrases
      .replace(/\b(latest|videos?|clips?|shorts?|trending|popular|viral)\b/gi, '') // Remove content type words
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    // Enrich query with intent-based keywords for better search
    cleanQuery = enrichQuery(cleanQuery, intent);

    console.log(`🎯 Intent detected: ${intent.type}`);
    console.log(`📝 Enriched query: "${cleanQuery}"`);

    return { type, channelId, sortBy, query: cleanQuery };
  }, []);

  const searchVideos = useCallback(async (
    query: string,
    options: SearchOptions = {}
  ): Promise<YouTubeVideo[]> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎬 Searching YouTube for:', query, options);

      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: String(options.maxResults || 10),
        order: options.sortBy || 'relevance',
        key: apiKey,
      });

      // Add channel filter if specified
      if (options.channelId) {
        params.append('channelId', options.channelId);
      }

      // Add video duration filter for shorts
      if (options.type === 'short') {
        params.append('videoDuration', 'short'); // < 4 minutes
      }

      const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.error?.message || 'YouTube search failed');
      }

      const searchData = await searchResponse.json();
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',') || '';

      if (!videoIds) {
        console.log('⚠️ No videos found');
        return [];
      }

      // Get video details (duration, view count, etc.)
      const detailsParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: apiKey,
      });

      const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch video details');
      }

      const detailsData = await detailsResponse.json();

      // Map videos and calculate quality scores
      const videosWithScores = detailsData.items?.map((item: any) => {
        const video: YouTubeVideo = {
          id: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          duration: item.contentDetails.duration,
          viewCount: item.statistics.viewCount,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        };

        const qualityScore = calculateQualityScore(item);
        return { video, qualityScore };
      }) || [];

      // Filter out low quality videos (score < 20) and sort by quality
      const highQualityVideos = videosWithScores
        .filter(({ qualityScore }) => qualityScore >= 20)
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .map(({ video }) => video);

      console.log(`✅ Found ${highQualityVideos.length} high-quality videos (filtered from ${videosWithScores.length})`);

      // Log top 3 results for debugging
      highQualityVideos.slice(0, 3).forEach((v, i) => {
        const score = videosWithScores.find(vs => vs.video.id === v.id)?.qualityScore || 0;
        console.log(`  ${i + 1}. [Score: ${score}] ${v.title.substring(0, 60)}...`);
      });

      return highQualityVideos;

    } catch (err) {
      console.error('❌ YouTube API error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrending = useCallback(async (category?: string): Promise<YouTubeVideo[]> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📈 Fetching trending videos...');

      const params = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults: '10',
        key: apiKey,
      });

      if (category) {
        params.append('videoCategoryId', category);
      }

      const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch trending videos');
      }

      const data = await response.json();
      const videos: YouTubeVideo[] = data.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
      })) || [];

      console.log(`✅ Found ${videos.length} trending videos`);
      return videos;

    } catch (err) {
      console.error('❌ YouTube trending error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trending videos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getChannelVideos = useCallback(async (
    channelId: string,
    maxResults: number = 10
  ): Promise<YouTubeVideo[]> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📺 Fetching channel videos for:', channelId);

      const searchParams = new URLSearchParams({
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: String(maxResults),
        key: apiKey,
      });

      const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
      if (!searchResponse.ok) {
        throw new Error('Failed to search channel videos');
      }

      const searchData = await searchResponse.json();
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',') || '';

      if (!videoIds) {
        console.log('⚠️ No videos found for channel');
        return [];
      }

      // Get video details
      const detailsParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: apiKey,
      });

      const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch video details');
      }

      const detailsData = await detailsResponse.json();

      // Map videos and calculate quality scores
      const videosWithScores = detailsData.items?.map((item: any) => {
        const video: YouTubeVideo = {
          id: item.id,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          duration: item.contentDetails.duration,
          viewCount: item.statistics.viewCount,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        };

        const qualityScore = calculateQualityScore(item);
        return { video, qualityScore };
      }) || [];

      // Filter and sort by quality (lower threshold for channel videos since they're already from a known source)
      const highQualityVideos = videosWithScores
        .filter(({ qualityScore }) => qualityScore >= 15) // Lower threshold for channel content
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .map(({ video }) => video);

      console.log(`✅ Found ${highQualityVideos.length} high-quality channel videos (filtered from ${videosWithScores.length})`);
      return highQualityVideos;

    } catch (err) {
      console.error('❌ Channel videos error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channel videos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchVideos,
    getTrending,
    getChannelVideos,
    processQuery,
    isLoading,
    error,
  };
}
