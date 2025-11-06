/**
 * Morning News API - Fetch live news stories using Perplexity
 * Optimized for morning show discussion topics
 */

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export interface NewsStory {
  id: string;
  headline: string;
  summary: string;
  category: 'breaking' | 'business' | 'real_estate' | 'tech' | 'entertainment' | 'sports' | 'politics' | 'general';
  source?: string;
  talkingPoints?: string[];
  timestamp: string;
  isVisible?: boolean;
}

/**
 * Fetch morning news stories using Perplexity
 */
export async function fetchMorningNews(): Promise<NewsStory[]> {
  console.log('📰 Fetching morning news stories via Perplexity...');

  if (!PERPLEXITY_API_KEY) {
    console.error('❌ VITE_PERPLEXITY_API_KEY not configured');
    return [];
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a morning show news curator for a business-focused audience. Today is ${currentDate}. Find the most engaging, discussion-worthy news stories from the past 24 hours. FOCUS ON: Business news, real estate market updates, entertainment industry deals, and major sports events. These should be conversation starters for professionals and entrepreneurs.`
          },
          {
            role: 'user',
            content: `Give me the top 5 most interesting news stories from TODAY (${currentDate}) that would be perfect for a business-focused morning talk show.

PRIORITY CATEGORIES:
1. Business & Finance (stock market, company news, mergers, startups)
2. Real Estate (property market, commercial deals, housing trends)
3. Entertainment Industry (box office, streaming deals, celebrity business ventures)
4. Sports Business (team valuations, athlete contracts, major upsets)

For each story, provide:

1. A catchy headline (max 80 characters)
2. A brief summary (2-3 sentences, business angle)
3. Category (business/real_estate/entertainment/sports/tech/breaking/general)
4. 3 talking points or questions for discussion (business impact focus)

Format as JSON array with this structure:
[
  {
    "headline": "...",
    "summary": "...",
    "category": "...",
    "talkingPoints": ["...", "...", "..."]
  }
]

Only return the JSON array, no other text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Perplexity API error details:', errorData);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Perplexity API response:', data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('❌ No content in Perplexity response');
      return [];
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    const stories = JSON.parse(jsonContent);

    // Add IDs and timestamps
    const processedStories: NewsStory[] = stories.map((story: any, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      headline: story.headline,
      summary: story.summary,
      category: story.category || 'general',
      source: story.source || 'Perplexity News',
      talkingPoints: story.talkingPoints || [],
      timestamp: new Date().toISOString()
    }));

    console.log(`📰 Fetched ${processedStories.length} morning news stories`);
    return processedStories;

  } catch (error) {
    console.error('❌ Failed to fetch morning news:', error);
    return [];
  }
}

/**
 * Fetch targeted news for specific category
 */
export async function fetchCategoryNews(category: string): Promise<NewsStory[]> {
  console.log(`📰 Fetching ${category} news...`);

  if (!PERPLEXITY_API_KEY) {
    console.error('❌ VITE_PERPLEXITY_API_KEY not configured');
    return [];
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a ${category} news curator for a morning show. Today is ${currentDate}.`
          },
          {
            role: 'user',
            content: `Give me the top 3 ${category} news stories from TODAY. Return as JSON array with headline, summary, and talkingPoints.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return [];

    let jsonContent = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const stories = JSON.parse(jsonContent);

    return stories.map((story: any, index: number) => ({
      id: `${category}-${Date.now()}-${index}`,
      headline: story.headline,
      summary: story.summary,
      category: category as NewsStory['category'],
      source: 'Perplexity News',
      talkingPoints: story.talkingPoints || [],
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error(`❌ Failed to fetch ${category} news:`, error);
    return [];
  }
}

/**
 * Get fallback demo news (for testing or when API fails)
 */
export function getDemoNews(): NewsStory[] {
  return [
    {
      id: 'demo-1',
      headline: 'Major Tech Breakthrough Announced This Morning',
      summary: 'A leading tech company unveiled groundbreaking AI technology that could revolutionize how we interact with digital assistants. Early reactions are overwhelmingly positive.',
      category: 'tech',
      source: 'Tech News Daily',
      talkingPoints: [
        'How will this impact everyday users?',
        'What are the privacy implications?',
        'Could this disrupt existing tech giants?'
      ],
      timestamp: new Date().toISOString()
    },
    {
      id: 'demo-2',
      headline: 'Sports World Reacts to Unexpected Championship Win',
      summary: 'In a stunning upset, the underdog team secured victory in last night\'s championship game, defying all predictions and odds.',
      category: 'sports',
      source: 'Sports Network',
      talkingPoints: [
        'What does this mean for next season?',
        'Who was the MVP of the game?',
        'How are fans celebrating?'
      ],
      timestamp: new Date().toISOString()
    },
    {
      id: 'demo-3',
      headline: 'Entertainment Industry Announces Major Collaboration',
      summary: 'Two entertainment powerhouses are joining forces for what\'s being called the biggest project of the decade. Details are still emerging.',
      category: 'entertainment',
      source: 'Entertainment Weekly',
      talkingPoints: [
        'What can fans expect from this collaboration?',
        'When will we see the first results?',
        'How will this change the industry?'
      ],
      timestamp: new Date().toISOString()
    }
  ];
}
