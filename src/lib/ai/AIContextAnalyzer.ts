// =====================================================
// AI CONTEXT ANALYZER - Analyzes conversation context using AI
// =====================================================

import type { AutomationEngine } from '../automation/AutomationEngine'
import type { ActionType } from '../automation/types'
import { contextLogger, logError } from '../logging/logger'

export interface SpeakerPosition {
  speaker: string
  stance: 'strongly_for' | 'for' | 'neutral' | 'against' | 'strongly_against'
  confidence: number
}

export interface AspectSentiment {
  topic: string
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  confidence: number
  keyPhrases: string[]
  speakerPositions: SpeakerPosition[]
}

export interface EmotionDetection {
  emotion: 'joy' | 'surprise' | 'anger' | 'frustration' | 'curiosity' | 'concern' | 'excitement'
  intensity: number // 0-1
  trigger: string
}

export interface ConversationDynamics {
  agreement_level: number // 0-1
  tension: number // 0-1
  momentum: 'building' | 'steady' | 'declining'
}

export interface AIAnalysisResult {
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  topic: string
  engagement: 'very_high' | 'high' | 'medium' | 'low'
  confidence: number
  suggestedActions: SuggestedAction[]
  reasoning: string
  // NEW: Aspect-based sentiment analysis
  aspects?: AspectSentiment[]
  emotions?: EmotionDetection[]
  dynamics?: ConversationDynamics
}

export interface SuggestedAction {
  actionType: ActionType
  actionData: Record<string, any>
  reasoning: string
  confidence: number
  priority: number
}

export interface AnalysisConfig {
  provider: 'openai' | 'anthropic' | 'mock'
  apiKey?: string
  model?: string
  contextWindow: number // Number of recent transcript segments to analyze
  analysisInterval: number // Seconds between analyses
  minConfidence: number // Minimum confidence to suggest actions
}

export interface TranscriptContext {
  recentTranscripts: string[]
  currentSegment?: string
  showDuration: number // seconds
  participantCount: number
}

export class AIContextAnalyzer {
  private automationEngine: AutomationEngine | null = null
  private aiCoordinator: import('./AICoordinator').AICoordinator | null = null
  private config: AnalysisConfig
  private isAnalyzing: boolean = false
  private lastAnalysis: AIAnalysisResult | null = null
  private analysisHistory: AIAnalysisResult[] = []
  private analysisCallbacks: ((result: AIAnalysisResult) => void)[] = []

  constructor(config?: Partial<AnalysisConfig>) {
    this.config = {
      provider: config?.provider || 'mock',
      apiKey: config?.apiKey,
      model: config?.model || 'gpt-4',
      contextWindow: config?.contextWindow || 10,
      analysisInterval: config?.analysisInterval || 30,
      minConfidence: config?.minConfidence || 0.7
    }
  }

  /**
   * Set automation engine for triggering actions
   */
  setAutomationEngine(engine: AutomationEngine) {
    this.automationEngine = engine
  }

  /**
   * Set AI Coordinator for routing actions through priority system
   */
  setCoordinator(coordinator: import('./AICoordinator').AICoordinator) {
    this.aiCoordinator = coordinator
    contextLogger.info('[AIContextAnalyzer] AI Coordinator connected')
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AnalysisConfig>) {
    this.config = { ...this.config, ...updates }
    contextLogger.info({ config: this.config }, '[AIContextAnalyzer] Config updated')
  }

  /**
   * Analyze transcript context and suggest actions
   */
  async analyze(context: TranscriptContext): Promise<AIAnalysisResult> {
    if (this.isAnalyzing) {
      contextLogger.debug('[AIContextAnalyzer] Analysis already in progress, skipping')
      return this.lastAnalysis || this.getDefaultResult()
    }

    this.isAnalyzing = true

    try {
      let result: AIAnalysisResult

      switch (this.config.provider) {
        case 'openai':
          result = await this.analyzeWithOpenAI(context)
          break
        case 'anthropic':
          result = await this.analyzeWithAnthropic(context)
          break
        case 'mock':
        default:
          result = await this.analyzeWithMock(context)
          break
      }

      // Store result
      this.lastAnalysis = result
      this.analysisHistory.push(result)
      if (this.analysisHistory.length > 100) {
        this.analysisHistory.shift()
      }

      // Notify callbacks
      this.analysisCallbacks.forEach(callback => callback(result))

      // Route suggested actions through AI Coordinator (priority system)
      if (this.aiCoordinator) {
        contextLogger.info('[AIContextAnalyzer] Routing actions through AI Coordinator...')

        for (const action of result.suggestedActions) {
          if (action.confidence >= this.config.minConfidence) {
            try {
              const actionResult = await this.aiCoordinator.executeProductionAction(action)

              if (actionResult.status === 'executed' || actionResult.status === 'applied') {
                contextLogger.info(`✅ Action executed: ${action.actionType}`)
              } else if (actionResult.status === 'blocked') {
                contextLogger.info(`🚫 Action blocked: ${action.actionType} - ${actionResult.reason}`)
              } else if (actionResult.status === 'not_implemented') {
                contextLogger.info(`⚠️ Action not yet implemented: ${action.actionType}`)
              }
            } catch (error) {
              logError(contextLogger, error as Error, `❌ Failed to execute action ${action.actionType}`)
            }
          }
        }
      }
      // Fallback to automation engine if coordinator not available
      else if (this.automationEngine) {
        contextLogger.info('[AIContextAnalyzer] Fallback to AutomationEngine (no coordinator)')

        for (const action of result.suggestedActions) {
          if (action.confidence >= this.config.minConfidence) {
            await this.automationEngine.processContext(
              {
                sentiment: result.sentiment,
                topic: result.topic,
                engagement: result.engagement
              },
              [] // Rules will be fetched by engine
            )
          }
        }
      }

      contextLogger.info({ result }, '[AIContextAnalyzer] Analysis complete')
      return result

    } catch (error) {
      logError(contextLogger, error as Error, '[AIContextAnalyzer] Analysis failed')
      return this.getDefaultResult()
    } finally {
      this.isAnalyzing = false
    }
  }

  /**
   * Analyze using OpenAI API
   */
  private async analyzeWithOpenAI(context: TranscriptContext): Promise<AIAnalysisResult> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = this.buildAnalysisPrompt(context)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI director assistant for a livestream show. Analyze the conversation context and suggest production actions to enhance the show.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content

    return this.parseAnalysisResponse(analysisText)
  }

  /**
   * Analyze using Anthropic API
   */
  private async analyzeWithAnthropic(context: TranscriptContext): Promise<AIAnalysisResult> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const prompt = this.buildAnalysisPrompt(context)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-opus-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: 'You are an AI director assistant for a livestream show. Analyze the conversation context and suggest production actions to enhance the show.',
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const analysisText = data.content[0].text

    return this.parseAnalysisResponse(analysisText)
  }

  /**
   * Mock analysis for testing without API
   */
  private async analyzeWithMock(context: TranscriptContext): Promise<AIAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Simple heuristic-based analysis
    const transcript = context.recentTranscripts.join(' ').toLowerCase()

    // Detect sentiment from keywords
    let sentiment: AIAnalysisResult['sentiment'] = 'neutral'
    if (transcript.includes('amazing') || transcript.includes('awesome') || transcript.includes('love')) {
      sentiment = 'very_positive'
    } else if (transcript.includes('good') || transcript.includes('nice') || transcript.includes('great')) {
      sentiment = 'positive'
    } else if (transcript.includes('bad') || transcript.includes('terrible') || transcript.includes('hate')) {
      sentiment = 'negative'
    }

    // Detect topic from keywords
    let topic = 'general discussion'
    if (transcript.includes('tech') || transcript.includes('technology') || transcript.includes('software')) {
      topic = 'technology'
    } else if (transcript.includes('game') || transcript.includes('gaming') || transcript.includes('play')) {
      topic = 'gaming'
    } else if (transcript.includes('news') || transcript.includes('politics')) {
      topic = 'news'
    } else if (transcript.includes('question') || transcript.includes('ask')) {
      topic = 'q&a'
    }

    // Detect engagement from length and participant count
    let engagement: AIAnalysisResult['engagement'] = 'medium'
    const wordCount = transcript.split(' ').length
    if (wordCount > 100 && context.participantCount > 1) {
      engagement = 'very_high'
    } else if (wordCount > 50) {
      engagement = 'high'
    } else if (wordCount < 10) {
      engagement = 'low'
    }

    // Generate suggested actions based on context
    const suggestedActions: SuggestedAction[] = []

    // Suggest BetaBot mood based on sentiment
    if (sentiment === 'very_positive') {
      suggestedActions.push({
        actionType: 'betabot.mood',
        actionData: { mood: 'excited', intensity: 8 },
        reasoning: 'Very positive sentiment detected - set BetaBot to excited mood',
        confidence: 0.85,
        priority: 3
      })
    } else if (sentiment === 'negative') {
      suggestedActions.push({
        actionType: 'betabot.mood',
        actionData: { mood: 'thoughtful', intensity: 6 },
        reasoning: 'Negative sentiment detected - set BetaBot to thoughtful mood',
        confidence: 0.75,
        priority: 3
      })
    }

    // Suggest camera switch based on engagement
    if (engagement === 'very_high') {
      suggestedActions.push({
        actionType: 'obs.scene',
        actionData: { sceneName: 'Wide Shot', transition: 'Fade' },
        reasoning: 'High engagement - switch to wide shot to show all participants',
        confidence: 0.8,
        priority: 3
      })
    }

    // Suggest lower third for Q&A
    if (topic === 'q&a') {
      suggestedActions.push({
        actionType: 'lower_third.show',
        actionData: { lower_third_id: 'qa', duration: 5000 },
        reasoning: 'Q&A topic detected - show Q&A lower third',
        confidence: 0.9,
        priority: 3
      })
    }

    // Generate aspect-based sentiment (mock data)
    const aspects: AspectSentiment[] = []
    const emotions: EmotionDetection[] = []

    // Detect aspects from keywords
    if (transcript.includes('tech') || transcript.includes('ai') || transcript.includes('software')) {
      aspects.push({
        topic: 'technology impact',
        sentiment: transcript.includes('amazing') || transcript.includes('great') ? 'positive' : 'neutral',
        confidence: 0.78,
        keyPhrases: ['technology advances', 'innovation potential'],
        speakerPositions: [
          { speaker: 'Host', stance: 'for', confidence: 0.72 },
          { speaker: 'Guest', stance: 'strongly_for', confidence: 0.85 }
        ]
      })
    }

    if (transcript.includes('job') || transcript.includes('work') || transcript.includes('employment')) {
      aspects.push({
        topic: 'employment concerns',
        sentiment: transcript.includes('bad') || transcript.includes('worry') ? 'negative' : 'neutral',
        confidence: 0.81,
        keyPhrases: ['job security', 'workforce changes'],
        speakerPositions: [
          { speaker: 'Host', stance: 'neutral', confidence: 0.70 },
          { speaker: 'Guest', stance: 'against', confidence: 0.76 }
        ]
      })
    }

    // Default aspect if none detected
    if (aspects.length === 0) {
      aspects.push({
        topic: 'general discussion',
        sentiment,
        confidence: 0.75,
        keyPhrases: ['interesting points', 'good conversation'],
        speakerPositions: [
          { speaker: 'Host', stance: 'neutral', confidence: 0.70 },
          { speaker: 'Guest', stance: 'neutral', confidence: 0.70 }
        ]
      })
    }

    // Detect emotions
    if (transcript.includes('amazing') || transcript.includes('awesome') || transcript.includes('love')) {
      emotions.push({
        emotion: 'excitement',
        intensity: 0.8,
        trigger: 'Positive language detected in discussion'
      })
    }
    if (transcript.includes('concern') || transcript.includes('worry') || transcript.includes('problem')) {
      emotions.push({
        emotion: 'concern',
        intensity: 0.6,
        trigger: 'Discussion of challenges or issues'
      })
    }
    if (transcript.includes('question') || transcript.includes('curious') || transcript.includes('wonder')) {
      emotions.push({
        emotion: 'curiosity',
        intensity: 0.7,
        trigger: 'Inquisitive tone in conversation'
      })
    }

    // Calculate dynamics
    const dynamics: ConversationDynamics = {
      agreement_level: sentiment === 'very_positive' ? 0.8 : sentiment === 'positive' ? 0.65 : 0.5,
      tension: engagement === 'very_high' ? 0.6 : engagement === 'high' ? 0.45 : 0.3,
      momentum: engagement === 'very_high' || engagement === 'high' ? 'building' : engagement === 'low' ? 'declining' : 'steady'
    }

    return {
      sentiment,
      topic,
      engagement,
      confidence: 0.75,
      suggestedActions,
      reasoning: `Analyzed ${context.recentTranscripts.length} transcript segments. Detected ${sentiment} overall sentiment with ${aspects.length} distinct aspects, ${emotions.length} emotions, and ${dynamics.momentum} momentum.`,
      aspects,
      emotions,
      dynamics
    }
  }

  /**
   * Build analysis prompt for AI with aspect-based sentiment
   */
  private buildAnalysisPrompt(context: TranscriptContext): string {
    return `
<task>
Analyze the following livestream conversation transcript and provide comprehensive aspect-based sentiment analysis.
</task>

<transcript>
${context.recentTranscripts.map((t, i) => `[Segment ${i + 1}] ${t}`).join('\n')}
</transcript>

<context>
- Show duration: ${context.showDuration} seconds
- Participants: ${context.participantCount}
</context>

<analysis_framework>
Perform MULTI-LAYERED analysis:

1. OVERALL SENTIMENT: very_positive, positive, neutral, negative, or very_negative
2. TOPIC: Main discussion topic (1-3 words)
3. ENGAGEMENT: very_high, high, medium, or low
4. CONFIDENCE: Analysis confidence (0.0-1.0)

5. ASPECT-BASED SENTIMENT (NEW):
   - Identify 2-4 specific topics/aspects being discussed
   - For EACH aspect, determine:
     a) Sentiment toward that specific topic
     b) Key phrases revealing sentiment
     c) Each speaker's position (strongly_for to strongly_against)

6. EMOTION DETECTION (NEW):
   - Detect specific emotions beyond positive/negative
   - Emotions: joy, surprise, anger, frustration, curiosity, concern, excitement
   - Intensity (0-1) and trigger phrase

7. CONVERSATION DYNAMICS (NEW):
   - Agreement level (0 = complete disagreement, 1 = complete agreement)
   - Tension level (0 = relaxed, 1 = high tension)
   - Momentum (building, steady, declining)

8. SUGGESTED ACTIONS: Production actions to enhance the show
</analysis_framework>

<output_format>
Return STRICT JSON format:
{
  "sentiment": "positive",
  "topic": "technology",
  "engagement": "high",
  "confidence": 0.85,
  "aspects": [
    {
      "topic": "AI impact on jobs",
      "sentiment": "negative",
      "confidence": 0.82,
      "keyPhrases": ["job displacement", "automation threat"],
      "speakerPositions": [
        { "speaker": "Host", "stance": "neutral", "confidence": 0.75 },
        { "speaker": "Guest", "stance": "against", "confidence": 0.88 }
      ]
    },
    {
      "topic": "AI creativity benefits",
      "sentiment": "positive",
      "confidence": 0.79,
      "keyPhrases": ["democratizing creativity", "new possibilities"],
      "speakerPositions": [
        { "speaker": "Host", "stance": "for", "confidence": 0.70 },
        { "speaker": "Guest", "stance": "strongly_for", "confidence": 0.85 }
      ]
    }
  ],
  "emotions": [
    {
      "emotion": "concern",
      "intensity": 0.7,
      "trigger": "Discussion of job displacement"
    },
    {
      "emotion": "excitement",
      "intensity": 0.6,
      "trigger": "New creative possibilities mentioned"
    }
  ],
  "dynamics": {
    "agreement_level": 0.45,
    "tension": 0.55,
    "momentum": "building"
  },
  "suggestedActions": [
    {
      "actionType": "betabot.mood",
      "actionData": { "mood": "thoughtful", "intensity": 7 },
      "reasoning": "Mixed emotions detected - thoughtful mood appropriate",
      "confidence": 0.82,
      "priority": 3
    }
  ],
  "reasoning": "Conversation shows nuanced discussion about AI with distinct aspects: job concerns (negative) vs creative potential (positive). Speakers partially agree, building tension productively."
}
</output_format>

<available_actions>
- betabot.mood, betabot.movement
- obs.scene, obs.source.show, obs.source.hide
- graphic.show, graphic.hide
- lower_third.show, lower_third.hide
- soundboard.play
- segment.switch
</available_actions>

<quality_guidelines>
- Identify REAL aspects (not generic)
- Distinguish speaker positions accurately
- Detect SPECIFIC emotions with triggers
- Provide actionable insights
- Be concise but comprehensive
</quality_guidelines>

Return ONLY the JSON object, no additional text.
`.trim()
  }

  /**
   * Parse AI response into structured result
   */
  private parseAnalysisResponse(responseText: string): AIAnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed as AIAnalysisResult

    } catch (error) {
      logError(contextLogger, error as Error, '[AIContextAnalyzer] Failed to parse response')
      return this.getDefaultResult()
    }
  }

  /**
   * Get default/fallback result
   */
  private getDefaultResult(): AIAnalysisResult {
    return {
      sentiment: 'neutral',
      topic: 'unknown',
      engagement: 'medium',
      confidence: 0,
      suggestedActions: [],
      reasoning: 'Analysis failed or not available'
    }
  }

  /**
   * Register callback for analysis results
   */
  onAnalysis(callback: (result: AIAnalysisResult) => void): () => void {
    this.analysisCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.analysisCallbacks.indexOf(callback)
      if (index > -1) {
        this.analysisCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get last analysis result
   */
  getLastAnalysis(): AIAnalysisResult | null {
    return this.lastAnalysis
  }

  /**
   * Get analysis history
   */
  getHistory(limit: number = 20): AIAnalysisResult[] {
    return this.analysisHistory.slice(-limit)
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      provider: this.config.provider,
      lastAnalysis: this.lastAnalysis,
      historyCount: this.analysisHistory.length
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.analysisHistory = []
    this.lastAnalysis = null
  }
}
