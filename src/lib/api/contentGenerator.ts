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
    tts_suitability_score?: number
  }>
  questions?: Array<{
    question: string
    relevance_score: number
    engagement_score: number
    tts_suitability_score?: number
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

  // Auto-approve and queue top content
  await autoApproveAndQueue(episodeId)

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
            content: `Generate 20 realistic listener questions based on this segment:

${segment.original_content}

For each question, provide:
- question: The actual question text (natural, conversational, 50-150 words)
- relevance_score: How relevant to the segment (1-10)
- engagement_score: How engaging/interesting (1-10)
- tts_suitability_score: How good this sounds when read aloud by TTS (1-10, consider: natural tone, good length, clear question, not too technical)

Return JSON array:
[
  {
    "question": "...",
    "relevance_score": 8,
    "engagement_score": 7,
    "tts_suitability_score": 9
  }
]

Make questions sound like REAL people asking - conversational, natural, not robotic or formal. Mix beginner and advanced questions. Keep length appropriate for TTS (50-150 words).

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
      // Calculate overall score (40% TTS, 30% relevance, 30% engagement)
      const ttsScore = q.tts_suitability_score || 5
      const overallScore = (ttsScore * 0.4) + (q.relevance_score * 0.3) + (q.engagement_score * 0.3)

      records.push({
        episode_info_id: episodeId,
        segment_id: segmentId,
        content_type: 'listener_question',
        content_data: q,
        relevance_score: q.relevance_score,
        engagement_score: q.engagement_score,
        tts_suitability_score: ttsScore,
        overall_score: overallScore,
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

/**
 * Auto-approve top content and queue for broadcast
 */
async function autoApproveAndQueue(episodeId: string) {
  console.log('🤖 Auto-approving and queueing top content...')

  try {
    // Get all questions for this episode, sorted by overall_score
    const { data: questions, error: questionsError } = await supabase
      .from('episode_ai_content')
      .select('*')
      .eq('episode_info_id', episodeId)
      .eq('content_type', 'listener_question')
      .order('overall_score', { ascending: false })
      .limit(10)

    if (questionsError) throw questionsError

    // Get all news stories
    const { data: newsStories, error: newsError } = await supabase
      .from('episode_ai_content')
      .select('*')
      .eq('episode_info_id', episodeId)
      .eq('content_type', 'news_story')
      .limit(3)

    if (newsError) throw newsError

    // Auto-approve top 10 questions
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id)
      await supabase
        .from('episode_ai_content')
        .update({
          is_approved: true,
          auto_approved: true,
          approved_at: new Date().toISOString()
        })
        .in('id', questionIds)

      console.log(`✅ Auto-approved ${questions.length} questions`)

      // Queue questions to show_questions table
      for (const q of questions) {
        await supabase
          .from('show_questions')
          .insert({
            topic: 'AI Generated',
            question_text: q.content_data.question,
            tts_generated: false,
            is_played: false,
            show_on_overlay: false
          })
      }

      // Mark as queued
      await supabase
        .from('episode_ai_content')
        .update({
          was_queued_for_broadcast: true,
          queued_at: new Date().toISOString()
        })
        .in('id', questionIds)

      console.log(`✅ Queued ${questions.length} questions to show_questions`)

      // Auto-generate TTS for all questions
      await autoGenerateTTS(questions)
    }

    // Auto-approve and queue top 3 news stories
    if (newsStories && newsStories.length > 0) {
      const newsIds = newsStories.map(n => n.id)
      await supabase
        .from('episode_ai_content')
        .update({
          is_approved: true,
          auto_approved: true,
          approved_at: new Date().toISOString()
        })
        .in('id', newsIds)

      console.log(`✅ Auto-approved ${newsStories.length} news stories`)

      // Queue news to morning_news_stories table
      for (let i = 0; i < newsStories.length; i++) {
        const story = newsStories[i].content_data
        const summary = `${story.layer1_surface || ''} ${story.layer2_reality || ''}`.trim()
        const talkingPoints = [
          `Surface: ${story.layer1_surface || 'N/A'}`,
          `Reality: ${story.layer2_reality || 'N/A'}`,
          `Narrative: ${story.layer3_narrative || 'N/A'}`
        ]

        await supabase
          .from('morning_news_stories')
          .insert({
            headline: story.title || 'Untitled Story',
            summary: summary || story.layer1_surface || 'No summary available',
            category: 'general',
            source: 'AI Generated (Perplexity)',
            talking_points: talkingPoints,
            is_visible: true,
            display_order: i + 1
          })
      }

      // Mark as queued
      await supabase
        .from('episode_ai_content')
        .update({
          was_queued_for_broadcast: true,
          queued_at: new Date().toISOString()
        })
        .in('id', newsIds)

      console.log(`✅ Queued ${newsStories.length} news stories to morning_news_stories`)
    }

  } catch (error) {
    console.error('❌ Error in auto-approve and queue:', error)
    // Don't throw - this is not critical, content generation succeeded
  }
}

/**
 * Auto-generate TTS for questions
 */
async function autoGenerateTTS(questions: any[]) {
  console.log('🎙️ Auto-generating TTS for questions...')

  try {
    // Get the most recent questions from show_questions (the ones we just inserted)
    const { data: showQuestions, error } = await supabase
      .from('show_questions')
      .select('*')
      .eq('topic', 'AI Generated')
      .is('tts_generated', false)
      .order('created_at', { ascending: false })
      .limit(questions.length)

    if (error) throw error
    if (!showQuestions || showQuestions.length === 0) return

    // Generate TTS for each question
    for (const q of showQuestions) {
      try {
        await generateTTSForQuestion(q.id, q.question_text)
        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err) {
        console.error(`❌ Failed to generate TTS for question ${q.id}:`, err)
        // Continue with next question even if one fails
      }
    }

    console.log(`✅ TTS generation complete`)
  } catch (error) {
    console.error('❌ Error in auto-generate TTS:', error)
  }
}

/**
 * Generate TTS for a single question (same logic as TTSQueuePanel)
 */
async function generateTTSForQuestion(questionId: string, text: string) {
  try {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tts`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text: text,
        voiceId: 'DTKMou8ccj1ZaWGBiotd' // ElevenLabs: Jamahal - Professional male voice
      }),
    })

    if (!response.ok) {
      throw new Error(`TTS generation failed: ${response.status}`)
    }

    const result = await response.json()

    if (result.error || !result.audioContent) {
      throw new Error(result.error || 'No audio content received')
    }

    // Convert base64 to blob
    const base64ToBlob = (base64: string, type: string): Blob => {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type })
    }

    const audioBlob = base64ToBlob(result.audioContent, 'audio/mpeg')
    const fileName = `betabot-${questionId}-${Date.now()}.mp3`

    const { error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tts-audio')
      .getPublicUrl(fileName)

    // Update database
    await supabase
      .from('show_questions')
      .update({
        tts_generated: true,
        tts_audio_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)

    console.log(`✅ TTS generated for question ${questionId}`)

  } catch (error) {
    console.error(`❌ TTS generation failed for question ${questionId}:`, error)
    throw error
  }
}
