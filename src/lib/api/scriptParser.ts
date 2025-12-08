/**
 * Script Parser - AI-powered episode script analysis
 * Uses Perplexity AI to parse show scripts into structured segments
 */

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export interface ParsedSegment {
  type: 'intro' | 'trending_news' | 'real_estate_qa' | 'deal_structures' | 'audience_interaction' | 'reality_breakdown' | 'closing' | 'custom'
  title: string
  content: string
  newsTopics?: string[] // Array of news topics to research
  clipLines?: string[] // Quotable moments
  estimatedDuration?: number // Seconds
  metadata?: {
    hasQuestions?: boolean
    category?: string
    priority?: 'high' | 'medium' | 'low'
  }
}

/**
 * Parse episode script using Perplexity AI
 */
export async function parseScript(scriptText: string): Promise<ParsedSegment[]> {
  console.log('🤖 Parsing script with Perplexity AI...')

  if (!PERPLEXITY_API_KEY) {
    console.error('❌ VITE_PERPLEXITY_API_KEY not configured')
    throw new Error('Perplexity API key not configured')
  }

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
            content: `You are an AI script parser for a livestream morning show. Your job is to analyze full episode scripts and break them down into structured segments.

SEGMENT TYPES:
- intro: Opening segment with energy/greeting
- trending_news: News stories and current events
- real_estate_qa: Real estate questions and answers
- deal_structures: Deal types and strategies
- audience_interaction: Q&A or chat moments
- reality_breakdown: Analysis or deep dives
- closing: Ending segment
- custom: Any other segment type

For each segment, identify:
1. Type (from above list)
2. Title (concise, descriptive)
3. Content (the actual script text)
4. News topics (if segment contains news - extract topic names for research)
5. Clip lines (quotable moments marked with "CLIP LINE:" or powerful statements)
6. Estimated duration in seconds

Return ONLY a JSON array, no other text.`
          },
          {
            role: 'user',
            content: `Parse this episode script into structured segments:

${scriptText}

Return a JSON array with this structure:
[
  {
    "type": "intro",
    "title": "Energy + Clarity + Purpose",
    "content": "Good morning — it's December 8th...",
    "newsTopics": [],
    "clipLines": ["quote 1", "quote 2"],
    "estimatedDuration": 120
  }
]

IMPORTANT:
- For news segments, extract topic names (e.g., "CNN x Kalshi partnership", "Netflix Warner Bros merger")
- Extract ALL clip lines you find (look for "CLIP LINE:" markers or powerful quotes)
- Estimate realistic durations (intro: 2-3min, news story: 3-5min, Q&A: 5-10min)
- Only return the JSON array, nothing else`
          }
        ],
        temperature: 0.3, // Low temperature for structured output
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Perplexity API error:', errorData)
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in Perplexity response')
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const segments: ParsedSegment[] = JSON.parse(jsonContent)

    console.log(`✅ Parsed ${segments.length} segments`)
    console.log('📊 Segment types:', segments.map(s => s.type))

    return segments

  } catch (error) {
    console.error('❌ Failed to parse script:', error)
    throw error
  }
}

/**
 * Extract clip lines from script (fallback parser if AI fails)
 */
export function extractClipLines(scriptText: string): string[] {
  const clipLines: string[] = []

  // Method 1: Look for "CLIP LINE:" markers
  const clipLineRegex = /CLIP LINE:\s*"?([^"\n]+)"?/gi
  let match
  while ((match = clipLineRegex.exec(scriptText)) !== null) {
    clipLines.push(match[1].trim())
  }

  // Method 2: Look for quoted statements after HOST:
  const hostQuoteRegex = /HOST:\s*"([^"]{50,200})"/g
  while ((match = hostQuoteRegex.exec(scriptText)) !== null) {
    const quote = match[1].trim()
    // Only include if it's a powerful statement (heuristic: contains certain keywords)
    if (
      quote.includes('...') ||
      quote.includes('—') ||
      quote.match(/\b(secret|truth|reality|key|power|must|never|always)\b/i)
    ) {
      clipLines.push(quote)
    }
  }

  return [...new Set(clipLines)] // Remove duplicates
}

/**
 * Simple segment detector (fallback if AI parser fails)
 */
export function detectSegments(scriptText: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []

  // Split by common markers
  const segmentMarkers = [
    /⭐\s*SEGMENT\s+(\d+)\s*[—-]\s*(.+)/gi,
    /🔥\s*NEWS STORY\s+(\d+):\s*(.+)/gi,
    /📋\s*PART\s+(\d+):\s*(.+)/gi
  ]

  const lines = scriptText.split('\n')
  let currentSegment: ParsedSegment | null = null

  for (const line of lines) {
    // Check if line is a segment header
    for (const marker of segmentMarkers) {
      const match = marker.exec(line)
      if (match) {
        // Save previous segment
        if (currentSegment) {
          segments.push(currentSegment)
        }

        // Start new segment
        currentSegment = {
          type: 'custom',
          title: match[2] || `Segment ${match[1]}`,
          content: '',
          newsTopics: [],
          clipLines: [],
          estimatedDuration: 300 // Default 5 minutes
        }
      }
    }

    // Add line to current segment
    if (currentSegment) {
      currentSegment.content += line + '\n'
    }
  }

  // Save last segment
  if (currentSegment) {
    segments.push(currentSegment)
  }

  return segments.length > 0 ? segments : [
    {
      type: 'custom',
      title: 'Full Script',
      content: scriptText,
      newsTopics: [],
      clipLines: extractClipLines(scriptText),
      estimatedDuration: 3600 // 1 hour default
    }
  ]
}
