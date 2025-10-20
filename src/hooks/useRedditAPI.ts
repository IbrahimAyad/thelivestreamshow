import { useState, useCallback } from 'react';

export interface RedditVideo {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  videoUrl: string;
  thumbnail: string;
  score: number;
  numComments: number;
  created: string;
  permalink: string;
  isYouTube: boolean;
  youtubeId?: string;
}

export interface UseRedditAPI {
  getTopVideos: (subreddit: string, timeframe?: 'day' | 'week' | 'month') => Promise<RedditVideo[]>;
  getMultiSubredditVideos: (subreddits: string[], timeframe?: 'day' | 'week' | 'month') => Promise<RedditVideo[]>;
  searchVideos: (query: string) => Promise<RedditVideo[]>;
  processQuery: (query: string) => { subreddits: string[]; searchTerms: string; timeframe: 'day' | 'week' | 'month' };
  isLoading: boolean;
  error: string | null;
}

// Popular video subreddits categorized by content type
export const VIDEO_SUBREDDITS = [
  'videos',
  'PublicFreakout',
  'NextFuckingLevel',
  'Unexpected',
  'funny',
  'gaming',
  'sports',
  'WatchPeopleDieInside',
  'ContagiousLaughter',
];

// Categorized subreddits for smart intent-based selection
const SUBREDDIT_CATEGORIES = {
  viral: ['NextFuckingLevel', 'Unexpected', 'videos', 'PublicFreakout', 'interestingasfuck'],
  funny: ['funny', 'ContagiousLaughter', 'Unexpected', 'WatchPeopleDieInside', 'youtubehaiku'],
  gaming: ['gaming', 'Games', 'LivestreamFail', 'Overwatch', 'FortNiteBR'],
  sports: ['sports', 'nba', 'nfl', 'soccer', 'MMA'],
  news: ['news', 'worldnews', 'PublicFreakout'],
  educational: ['Documentaries', 'educationalgifs', 'explainlikeimfive'],
  music: ['Music', 'listentothis', 'hiphopheads'],
  tech: ['technology', 'gadgets', 'pcmasterrace'],
  general: ['videos', 'NextFuckingLevel', 'Unexpected', 'PublicFreakout'],
};

const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/access_token';

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Detect content category from query
const detectContentCategory = (query: string): keyof typeof SUBREDDIT_CATEGORIES => {
  const q = query.toLowerCase();

  if (q.match(/\b(funny|laugh|hilarious|humor|joke|comedy)\b/i)) return 'funny';
  if (q.match(/\b(game|gaming|gameplay|esports|twitch|streamer)\b/i)) return 'gaming';
  if (q.match(/\b(sport|nba|nfl|soccer|football|basketball|hockey|baseball)\b/i)) return 'sports';
  if (q.match(/\b(news|breaking|politics|world)\b/i)) return 'news';
  if (q.match(/\b(learn|tutorial|documentary|educational|explain)\b/i)) return 'educational';
  if (q.match(/\b(music|song|concert|performance|album)\b/i)) return 'music';
  if (q.match(/\b(tech|technology|gadget|phone|computer|software)\b/i)) return 'tech';
  if (q.match(/\b(viral|trending|popular|insane|crazy|amazing)\b/i)) return 'viral';

  return 'general';
};

// Detect timeframe from query
const detectTimeframe = (query: string): 'day' | 'week' | 'month' => {
  const q = query.toLowerCase();

  if (q.match(/\b(today|recent|now|latest)\b/i)) return 'day';
  if (q.match(/\b(this week|past week|week)\b/i)) return 'week';
  if (q.match(/\b(this month|past month|month|all time)\b/i)) return 'month';

  return 'day'; // Default to today
};

// Quality score for Reddit videos
const calculateRedditQualityScore = (post: any): number => {
  let score = 0;

  // Upvote count (max 40 points)
  const upvotes = post.score || 0;
  if (upvotes > 10000) score += 40;
  else if (upvotes > 5000) score += 35;
  else if (upvotes > 1000) score += 30;
  else if (upvotes > 500) score += 20;
  else if (upvotes > 100) score += 10;

  // Upvote ratio (max 25 points) - higher ratio = better quality
  const upvoteRatio = post.upvote_ratio || 0;
  score += Math.floor(upvoteRatio * 25);

  // Comment count indicates engagement (max 20 points)
  const comments = post.numComments || post.num_comments || 0;
  if (comments > 500) score += 20;
  else if (comments > 100) score += 15;
  else if (comments > 50) score += 10;
  else if (comments > 10) score += 5;

  // Awards indicate quality content (max 15 points)
  const awards = post.total_awards_received || 0;
  if (awards > 10) score += 15;
  else if (awards > 5) score += 10;
  else if (awards > 0) score += 5;

  return score;
};

export function useRedditAPI(): UseRedditAPI {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);

  // Process query to determine best subreddits and search terms
  const processQuery = useCallback((query: string) => {
    const category = detectContentCategory(query);
    const timeframe = detectTimeframe(query);

    // Get relevant subreddits for this category
    const subreddits = SUBREDDIT_CATEGORIES[category].slice(0, 5); // Top 5 relevant subs

    // Clean search terms
    const searchTerms = query
      .replace(/\b(hey|hi|hello|beta\s*bot|bot|betabot)\b/gi, '')
      .replace(/\b(can you|could you|please|show me|find|search for|pull up|look up|get me)\b/gi, '')
      .replace(/\b(videos?|clips?|reddit)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`🎯 Reddit category detected: ${category}`);
    console.log(`📝 Searching subreddits: ${subreddits.join(', ')}`);
    console.log(`⏰ Timeframe: ${timeframe}`);

    return { subreddits, searchTerms, timeframe };
  }, []);

  // Get OAuth access token
  const getAccessToken = useCallback(async (): Promise<string> => {
    const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured');
    }

    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiry) {
      return accessToken;
    }

    console.log('🔑 Getting Reddit access token...');

    const auth = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch(REDDIT_AUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to authenticate with Reddit');
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in * 1000; // Convert to milliseconds

    setAccessToken(token);
    setTokenExpiry(Date.now() + expiresIn - 60000); // Refresh 1 min before expiry

    console.log('✅ Reddit access token obtained');
    return token;
  }, [accessToken, tokenExpiry]);

  const getTopVideos = useCallback(async (
    subreddit: string,
    timeframe: 'day' | 'week' | 'month' = 'day'
  ): Promise<RedditVideo[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎥 Fetching top videos from r/${subreddit}...`);

      const token = await getAccessToken();
      const response = await fetch(
        `${REDDIT_API_BASE}/r/${subreddit}/top.json?t=${timeframe}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'BetaBot/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from r/${subreddit}`);
      }

      const data = await response.json();
      const posts = data.data?.children || [];

      // Filter for video posts and calculate quality scores
      const videosWithScores = posts
        .map((child: any) => child.data)
        .filter((post: any) => {
          // Check if post has video
          if (post.is_video) return true;
          // Check if post links to YouTube
          if (post.domain?.includes('youtube.com') || post.domain?.includes('youtu.be')) return true;
          // Check if post has Reddit video
          if (post.domain === 'v.redd.it') return true;
          return false;
        })
        .map((post: any) => {
          const isYouTube = post.domain?.includes('youtube.com') || post.domain?.includes('youtu.be');
          const youtubeId = isYouTube ? extractYouTubeId(post.url) : undefined;

          const video: RedditVideo = {
            id: post.id,
            title: post.title,
            author: post.author,
            subreddit: post.subreddit,
            videoUrl: isYouTube ? post.url : (post.media?.reddit_video?.fallback_url || post.url),
            thumbnail: post.thumbnail !== 'self' ? post.thumbnail : '',
            score: post.score,
            numComments: post.num_comments,
            created: new Date(post.created_utc * 1000).toISOString(),
            permalink: `https://reddit.com${post.permalink}`,
            isYouTube,
            youtubeId,
          };

          const qualityScore = calculateRedditQualityScore(post);
          return { video, qualityScore, post };
        });

      // Filter by quality (score >= 30 for high-quality content) and sort
      const highQualityVideos = videosWithScores
        .filter(({ qualityScore }) => qualityScore >= 30)
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .map(({ video }) => video);

      console.log(`✅ Found ${highQualityVideos.length} high-quality videos from r/${subreddit} (filtered from ${videosWithScores.length})`);

      // Log top 3 for debugging
      highQualityVideos.slice(0, 3).forEach((v, i) => {
        const score = videosWithScores.find(vs => vs.video.id === v.id)?.qualityScore || 0;
        console.log(`  ${i + 1}. [Score: ${score}] ${v.title.substring(0, 60)}... (⬆️${v.score})`);
      });

      return highQualityVideos;

    } catch (err) {
      console.error(`❌ Reddit API error (r/${subreddit}):`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Reddit videos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const getMultiSubredditVideos = useCallback(async (
    subreddits: string[],
    timeframe: 'day' | 'week' | 'month' = 'day'
  ): Promise<RedditVideo[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎥 Fetching videos from ${subreddits.length} subreddits...`);

      // Fetch from all subreddits in parallel
      const videoPromises = subreddits.map(sub => getTopVideos(sub, timeframe));
      const videoArrays = await Promise.all(videoPromises);

      // Flatten and sort by score
      const allVideos = videoArrays.flat().sort((a, b) => b.score - a.score);

      // Remove duplicates by video URL
      const uniqueVideos = Array.from(
        new Map(allVideos.map(v => [v.videoUrl, v])).values()
      );

      // Limit to top 25
      const topVideos = uniqueVideos.slice(0, 25);

      console.log(`✅ Found ${topVideos.length} unique videos across all subreddits`);
      return topVideos;

    } catch (err) {
      console.error('❌ Multi-subreddit fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getTopVideos]);

  // Smart search videos using query processing
  const searchVideos = useCallback(async (query: string): Promise<RedditVideo[]> => {
    const { subreddits, searchTerms, timeframe } = processQuery(query);

    console.log(`🔍 Reddit smart search initiated for: "${query}"`);

    // Fetch from category-specific subreddits
    const videos = await getMultiSubredditVideos(subreddits, timeframe);

    // If we have search terms, filter results by relevance
    if (searchTerms && searchTerms.length > 2) {
      const searchLower = searchTerms.toLowerCase();
      const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchLower) ||
        v.subreddit.toLowerCase().includes(searchLower)
      );

      console.log(`📊 Filtered to ${filteredVideos.length} relevant videos (from ${videos.length})`);
      return filteredVideos.slice(0, 10); // Limit to top 10
    }

    return videos.slice(0, 10); // Limit to top 10
  }, [processQuery, getMultiSubredditVideos]);

  return {
    getTopVideos,
    getMultiSubredditVideos,
    searchVideos,
    processQuery,
    isLoading,
    error,
  };
}
