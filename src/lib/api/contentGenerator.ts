/**
 * AI Content Generator - Generate show content using Perplexity AI
 * Generates news stories, listener questions, talking points for each segment
 */

import { supabase } from '../supabase'

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

interface AIGeneratedContent {
  news_stories?: Array<{
    title: string
    layer1_surface: string
    layer2_reality: string
    layer3_narrative: string
    sources?: string[]
  }>
  questions?: Array<{
    question: string
    relevance_score: number
    engagement_score: number
  }>
  talking_points?: string[]
  clip_lines?: string[]
}

/**
 * Generate AI content for a specific segment
 */
export async function generateAIContent(segment: any, episodeId: string): Promise<AIGeneratedContent> {
  console.log('🤖 Generating AI content for:', segment.title, segment.segment_type)

  const content: AIGeneratedContent = {}

  // Generate different content based on segment type
  if (segment.segment_type === 'trending_news') {
    content.news_stories = await generateNewsStories(segment)
  }

  if (segment.segment_type === 'real_estate_qa' || segment.segment_type === 'deal_structures') {
    content.questions = await generateListenerQuestions(segment)
  }

  // Always generate talking points and clip lines
  content.talking_points = await generateTalkingPoints(segment)
  content.clip_lines = extractClipLines(segment.original_content)

  // Save generated content to database
  await saveAIContentToDatabase(content, segment.id, episodeId)

  return content
}

/**
 * Generate news stories with Three Layers analysis
 */
async function generateNewsStories(segment: any): Promise<any[]> {
  console.log('📰 Generating news stories for segment...')

  if (!PERPLEXITY_API_KEY) {
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
            content: `You are a news analyst for a morning show. Your job is to research news topics and apply the "Three Layers" framework:
- Layer 1 (Surface): What the headline says
- Layer 2 (Reality): What's actually happening behind the scenes
- Layer 3 (Narrative): What someone wants you to believe

Be critical, insightful, and business-focused.`
          },
          {
            role: 'user',
            content: `Analyze this news segment and generate detailed research with the Three Layers framework:

${segment.original_content}

For each news topic mentioned, provide:
1. title: The news story title
2. layer1_surface: The headline/surface story (1-2 sentences)
3. layer2_reality: What's actually happening (business angle, motivations, 2-3 sentences)
4. layer3_narrative: What narrative is being pushed and why (critical analysis, 2-3 sentences)
5. sources: Array of source URLs from your research

Return JSON array:
[
  {
    "title": "...",
    "layer1_surface": "...",
    "layer2_reality": "...",
    "layer3_narrative": "...",
    "sources": ["https://..."]
  }
]

IMPORTANT: Only return the JSON array, no other text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in response')
    }

    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const stories = JSON.parse(jsonContent)
    console.log(`✅ Generated ${stories.length} news stories`)

    return stories

  } catch (error) {
    console.error('❌ Error generating news stories:', error)
    throw error
  }
}

/**
 * Generate realistic listener questions
 */
async function generateListenerQuestions(segment: any): Promise<any[]> {
  console.log('❓ Generating listener questions...')

  if (!PERPLEXITY_API_KEY) {
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
            content: `You are simulating realistic listener questions for a business/real estate morning show. Generate questions that sound like they come from REAL people:
- Beginners asking basic questions
- Experienced investors asking tactical questions
- People with specific scenarios
- Skeptics challenging assumptions

Questions should be conversational, natural, and varied in sophistication.`
          },
          {
            role: 'user',
            content: `Generate 10 realistic listener questions based on this segment:

${segment.original_content}

For each question, provide:
- question: The actual question text (natural, conversational)
- relevance_score: How relevant to the segment (1-10)
- engagement_score: How engaging/interesting (1-10)

Return JSON array:
[
  {
    "question": "...",
    "relevance_score": 8,
    "engagement_score": 7
  }
]

Make questions sound like real people asking, not robotic. Mix beginner and advanced questions.

IMPORTANT: Only return the JSON array, no other text.`
          }
        ],
        temperature: 0.8, // Higher for more creative questions
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in response')
    }

    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const questions = JSON.parse(jsonContent)
    console.log(`✅ Generated ${questions.length} listener questions`)

    return questions

  } catch (error) {
    console.error('❌ Error generating questions:', error)
    throw error
  }
}

/**
 * Generate talking points for host
 */
async function generateTalkingPoints(segment: any): Promise<string[]> {
  console.log('💡 Generating talking points...')

  if (!PERPLEXITY_API_KEY) {
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
            content: 'You are a morning show producer creating bullet-point talking points for the host. Keep them concise, punchy, and easy to reference during live broadcast.'
          },
          {
            role: 'user',
            content: `Create 5-7 concise talking points for this segment:

${segment.original_content}

Return as JSON array of strings:
["Talking point 1", "Talking point 2", ...]

IMPORTANT: Only return the JSON array, no other text.`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return []
    }

    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const points = JSON.parse(jsonContent)
    console.log(`✅ Generated ${points.length} talking points`)

    return points

  } catch (error) {
    console.error('❌ Error generating talking points:', error)
    return []
  }
}

/**
 * Extract clip lines from content
 */
function extractClipLines(content: string): string[] {
  const clipLines: string[] = []

  // Look for "CLIP LINE:" markers
  const clipLineRegex = /CLIP LINE:\s*"?([^"\n]+)"?/gi
  let match
  while ((match = clipLineRegex.exec(content)) !== null) {
    clipLines.push(match[1].trim())
  }

  return clipLines
}

/**
 * Save AI-generated content to database
 */
async function saveAIContentToDatabase(content: AIGeneratedContent, segmentId: string, episodeId: string) {
  const records: any[] = []

  // Save news stories
  if (content.news_stories) {
    for (const story of content.news_stories) {
      records.push({
        episode_info_id: episodeId,
        segment_id: segmentId,
        content_type: 'news_story',
        content_data: story,
        relevance_score: 8,
        engagement_score: 7,
        is_approved: false
      })
    }
  }

  // Save questions
  if (content.questions) {
    for (const q of content.questions) {
      records.push({
        episode_info_id: episodeId,
        segment_id: segmentId,
        content_type: 'listener_question',
        content_data: q,
        relevance_score: q.relevance_score,
        engagement_score: q.engagement_score,
        is_approved: false
      })
    }
  }

  // Save talking points
  if (content.talking_points) {
    for (const point of content.talking_points) {
      records.push({
        episode_info_id: episodeId,
        segment_id: segmentId,
        content_type: 'talking_point',
        content_data: { text: point },
        is_approved: true // Auto-approve talking points
      })
    }
  }

  // Save clip lines
  if (content.clip_lines) {
    for (const line of content.clip_lines) {
      records.push({
        episode_info_id: episodeId,
        segment_id: segmentId,
        content_type: 'clip_line',
        content_data: { text: line },
        engagement_score: 8,
        is_approved: false
      })
    }
  }

  if (records.length > 0) {
    const { error } = await supabase
      .from('episode_ai_content')
      .insert(records)

    if (error) {
      console.error('❌ Error saving AI content to database:', error)
      throw error
    }

    console.log(`✅ Saved ${records.length} AI content items to database`)
  }
}
