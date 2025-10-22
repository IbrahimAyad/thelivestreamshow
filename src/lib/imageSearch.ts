/**
 * Image Search Integration
 *
 * Searches Unsplash for images
 * Activated by "Abra" keyword
 */

export interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  width: number;
  height: number;
  photographer: string;
}

/**
 * Search for images using Unsplash API
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
    const errorText = await response.text();
    console.error('Unsplash API error:', errorText);
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((item: any) => ({
    title: item.alt_description || item.description || 'Untitled',
    url: item.urls.regular,
    thumbnail: item.urls.small,
    source: `https://unsplash.com/photos/${item.id}`,
    width: item.width,
    height: item.height,
    photographer: item.user.name
  }));
}
