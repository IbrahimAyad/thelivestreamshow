/**
 * Perplexity Search Integration
 *
 * Searches web using Perplexity AI
 * Activated by "Alakazam" keyword
 */

export interface PerplexityResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

/**
 * Search using Perplexity API
 */
export async function searchPerplexity(query: string): Promise<PerplexityResult> {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_PERPLEXITY_API_KEY not configured');
  }

  console.log('🔍 Searching Perplexity:', query);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide concise, accurate answers with sources.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.2,
      return_citations: true,
      search_recency_filter: 'month'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Perplexity API error:', errorText);
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const data = await response.json();

  const answer = data.choices[0].message.content;
  const citations = data.citations || [];

  return {
    answer,
    sources: citations.map((url: string, idx: number) => ({
      title: `Source ${idx + 1}`,
      url
    }))
  };
}
