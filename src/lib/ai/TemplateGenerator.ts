/**
 * AI-Powered Template Generation
 *
 * Uses OpenAI GPT-4o to generate show templates based on show type and topic.
 * Provides quick templates for common show formats.
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export interface TemplateSegment {
  name: string
  topic: string
  question: string
  estimatedMinutes: number
}

export interface TemplateQuestion {
  text: string
  topic: string
  category: 'opener' | 'deep_dive' | 'transition' | 'closer'
}

export interface GeneratedTemplate {
  name: string
  description: string
  segments: TemplateSegment[]
  questions: TemplateQuestion[]
  recommendedDuration: number
}

/**
 * Generate a custom show template using AI
 */
export async function generateShowTemplate(
  showType: string,
  showTopic: string,
  targetDuration: number = 60 // minutes
): Promise<GeneratedTemplate> {
  const prompt = `You are a professional show producer. Generate a structured show template.

Show Type: ${showType}
Main Topic: ${showTopic}
Target Duration: ${targetDuration} minutes

Generate a complete show template with:
1. Show name (creative, memorable)
2. Description (1-2 sentences)
3. Segments (4-6 segments with timing that adds up to target duration)
4. Question bank (10-15 questions across categories)

Format as JSON:
{
  "name": "Show Name",
  "description": "Description",
  "recommendedDuration": ${targetDuration},
  "segments": [
    {
      "name": "Segment Name",
      "topic": "What this segment covers",
      "question": "Key question for this segment",
      "estimatedMinutes": 10
    }
  ],
  "questions": [
    {
      "text": "Question text?",
      "topic": "Category/Topic",
      "category": "opener|deep_dive|transition|closer"
    }
  ]
}

Make it professional, engaging, and well-structured for ${showType} about ${showTopic}.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional show producer who creates engaging show formats. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from AI')

    return JSON.parse(content) as GeneratedTemplate

  } catch (error) {
    console.error('Failed to generate template:', error)
    throw error
  }
}

/**
 * Quick templates for common show formats
 * These are pre-built and don't require AI generation
 */
export const QUICK_TEMPLATES: Record<string, GeneratedTemplate> = {
  'tech-talk': {
    name: 'Weekly Tech Talk',
    description: 'Discussion show focused on technology trends and news',
    recommendedDuration: 60,
    segments: [
      {
        name: 'Intro',
        topic: 'Welcome & Episode Overview',
        question: 'What are we covering today?',
        estimatedMinutes: 5
      },
      {
        name: 'Tech News',
        topic: 'Latest Industry News',
        question: 'What\'s happening in tech this week?',
        estimatedMinutes: 15
      },
      {
        name: 'Deep Dive',
        topic: 'Main Topic Discussion',
        question: 'How does this impact developers?',
        estimatedMinutes: 25
      },
      {
        name: 'Q&A',
        topic: 'Audience Questions',
        question: 'What questions do you have?',
        estimatedMinutes: 10
      },
      {
        name: 'Outro',
        topic: 'Wrap Up & Next Week',
        question: 'What should we cover next time?',
        estimatedMinutes: 5
      }
    ],
    questions: [
      { text: 'What brought you to tech?', topic: 'Background', category: 'opener' },
      { text: 'What are your thoughts on AI?', topic: 'AI/ML', category: 'deep_dive' },
      { text: 'How do you stay current?', topic: 'Learning', category: 'deep_dive' },
      { text: 'What tools do you use daily?', topic: 'Tools', category: 'deep_dive' },
      { text: 'Any advice for beginners?', topic: 'Advice', category: 'closer' }
    ]
  },

  'interview': {
    name: 'Interview Series',
    description: 'One-on-one conversations with industry experts',
    recommendedDuration: 55,
    segments: [
      {
        name: 'Intro',
        topic: 'Guest Introduction',
        question: 'Who is our guest today?',
        estimatedMinutes: 5
      },
      {
        name: 'Background',
        topic: 'Guest Background & Journey',
        question: 'How did you get started?',
        estimatedMinutes: 15
      },
      {
        name: 'Expertise Deep Dive',
        topic: 'Main Topic of Expertise',
        question: 'What makes this important?',
        estimatedMinutes: 20
      },
      {
        name: 'Rapid Fire',
        topic: 'Quick Questions',
        question: 'Favorite tool/book/advice?',
        estimatedMinutes: 10
      },
      {
        name: 'Outro',
        topic: 'Where to Find Guest',
        question: 'How can people connect with you?',
        estimatedMinutes: 5
      }
    ],
    questions: [
      { text: 'Tell us about your journey', topic: 'Background', category: 'opener' },
      { text: 'What was your biggest breakthrough?', topic: 'Career', category: 'deep_dive' },
      { text: 'What challenges did you face?', topic: 'Obstacles', category: 'deep_dive' },
      { text: 'What advice would you give your younger self?', topic: 'Advice', category: 'deep_dive' },
      { text: 'What are you working on next?', topic: 'Future', category: 'closer' }
    ]
  },

  'educational': {
    name: 'Educational Workshop',
    description: 'Teaching and tutorial sessions',
    recommendedDuration: 60,
    segments: [
      {
        name: 'Intro',
        topic: 'Today\'s Learning Goals',
        question: 'What will we build today?',
        estimatedMinutes: 5
      },
      {
        name: 'Concept Overview',
        topic: 'Theory & Fundamentals',
        question: 'Why does this matter?',
        estimatedMinutes: 15
      },
      {
        name: 'Live Demo',
        topic: 'Hands-On Implementation',
        question: 'Let\'s build it together',
        estimatedMinutes: 30
      },
      {
        name: 'Common Mistakes',
        topic: 'Troubleshooting',
        question: 'What can go wrong?',
        estimatedMinutes: 5
      },
      {
        name: 'Outro',
        topic: 'Resources & Next Steps',
        question: 'What should you practice?',
        estimatedMinutes: 5
      }
    ],
    questions: [
      { text: 'What will we learn today?', topic: 'Goals', category: 'opener' },
      { text: 'Why is this important?', topic: 'Motivation', category: 'opener' },
      { text: 'How does this work under the hood?', topic: 'Deep Dive', category: 'deep_dive' },
      { text: 'What are common mistakes?', topic: 'Pitfalls', category: 'deep_dive' },
      { text: 'What resources do you recommend?', topic: 'Resources', category: 'closer' }
    ]
  },

  'gaming': {
    name: 'Gaming Stream',
    description: 'Live gaming with audience interaction',
    recommendedDuration: 90,
    segments: [
      {
        name: 'Pre-Game',
        topic: 'Welcome & Setup',
        question: 'What are we playing today?',
        estimatedMinutes: 10
      },
      {
        name: 'Main Gameplay',
        topic: 'Core Gaming Session',
        question: 'Let\'s dive in!',
        estimatedMinutes: 60
      },
      {
        name: 'Community Time',
        topic: 'Chat Interaction',
        question: 'What did you think?',
        estimatedMinutes: 15
      },
      {
        name: 'Wrap Up',
        topic: 'Highlights & Next Stream',
        question: 'Best moments?',
        estimatedMinutes: 5
      }
    ],
    questions: [
      { text: 'What game should we try next?', topic: 'Game Selection', category: 'opener' },
      { text: 'What\'s your strategy here?', topic: 'Gameplay', category: 'deep_dive' },
      { text: 'Have you played this before?', topic: 'Experience', category: 'transition' },
      { text: 'What was your favorite moment?', topic: 'Highlights', category: 'closer' }
    ]
  },

  'news-roundup': {
    name: 'News & Updates',
    description: 'Regular news roundup and commentary',
    recommendedDuration: 45,
    segments: [
      {
        name: 'Headlines',
        topic: 'Top Stories',
        question: 'What\'s making news?',
        estimatedMinutes: 10
      },
      {
        name: 'Story 1',
        topic: 'First Deep Dive',
        question: 'What does this mean?',
        estimatedMinutes: 12
      },
      {
        name: 'Story 2',
        topic: 'Second Deep Dive',
        question: 'Why does this matter?',
        estimatedMinutes: 12
      },
      {
        name: 'Hot Takes',
        topic: 'Commentary & Analysis',
        question: 'What\'s your take?',
        estimatedMinutes: 8
      },
      {
        name: 'Preview',
        topic: 'What to Watch',
        question: 'What\'s coming next?',
        estimatedMinutes: 3
      }
    ],
    questions: [
      { text: 'What\'s the biggest story today?', topic: 'News', category: 'opener' },
      { text: 'How does this affect people?', topic: 'Impact', category: 'deep_dive' },
      { text: 'What are the implications?', topic: 'Analysis', category: 'deep_dive' },
      { text: 'What should we watch for?', topic: 'Future', category: 'closer' }
    ]
  }
}

/**
 * Get list of available quick template keys
 */
export function getQuickTemplateKeys(): string[] {
  return Object.keys(QUICK_TEMPLATES)
}

/**
 * Get a quick template by key
 */
export function getQuickTemplate(key: string): GeneratedTemplate | null {
  return QUICK_TEMPLATES[key] || null
}
