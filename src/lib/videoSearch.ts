/**
 * Video Search Integration
 *
 * Searches YouTube for videos
 * Activated by "Kadabra" keyword
 */

export interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  channel: string;
  description: string;
}

/**
 * Search for videos using YouTube Data API v3
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
    const errorText = await response.text();
    console.error('YouTube API error:', errorText);
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item: any) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: 'N/A', // Would need additional API call to videos endpoint
    channel: item.snippet.channelTitle,
    description: item.snippet.description
  }));
}
