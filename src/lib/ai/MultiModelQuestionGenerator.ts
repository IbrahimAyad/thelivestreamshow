/**
 * Multi-Model Question Generator
 * Phase 2 - Generates questions from GPT-4o, Claude, and Gemini in parallel
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratedQuestion, TranscriptAnalysis } from '../../hooks/useProducerAI';
import {
  MultiModelConfig,
  MultiModelGenerationResult,
  ModelGenerationResult,
  APIKeys,
  MODEL_PRICING,
  AIModel,
  UsageMetadata
} from './types';

export class MultiModelQuestionGenerator {
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private config: MultiModelConfig;
  private apiKeys: APIKeys;

  constructor(config: MultiModelConfig, apiKeys: APIKeys) {
    this.config = config;
    this.apiKeys = apiKeys;

    // Initialize Anthropic SDK if enabled
    if (config.claude.enabled && apiKeys.anthropic) {
      this.anthropic = new Anthropic({ apiKey: apiKeys.anthropic });
    }

    // Initialize Gemini SDK if enabled
    if (config.gemini.enabled && apiKeys.gemini) {
      this.gemini = new GoogleGenerativeAI(apiKeys.gemini);
    }
  }

  /**
   * Generate questions from all enabled models in parallel
   */
  async generateQuestions(transcript: string): Promise<MultiModelGenerationResult> {
    console.log('🎯 Multi-Model Generation: Starting parallel question generation...');
    const startTime = Date.now();

    const promises: Promise<ModelGenerationResult | null>[] = [];
    const errors: Record<AIModel, string | null> = {
      'gpt-4o': null,
      'claude': null,
      'gemini': null
    };

    // Queue up parallel generation tasks
    if (this.config.gpt4o.enabled && this.apiKeys.openai) {
      promises.push(
        this.generateWithGPT4o(transcript)
          .catch(error => {
            errors['gpt-4o'] = error.message;
            console.error('❌ GPT-4o generation failed:', error.message);
            return null;
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (this.config.claude.enabled && this.anthropic) {
      promises.push(
        this.generateWithClaude(transcript)
          .catch(error => {
            errors['claude'] = error.message;
            console.error('❌ Claude generation failed:', error.message);
            return null;
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (this.config.gemini.enabled && this.gemini) {
      promises.push(
        this.generateWithGemini(transcript)
          .catch(error => {
            errors['gemini'] = error.message;
            console.error('❌ Gemini generation failed:', error.message);
            return null;
          })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    // Execute in parallel
    const results = await Promise.all(promises);
    const [gpt4oResult, claudeResult, geminiResult] = results;

    const totalTiming = Date.now() - startTime;
    const totalCost = [gpt4oResult, claudeResult, geminiResult]
      .filter(r => r !== null)
      .reduce((sum, r) => sum + (r?.cost || 0), 0);

    const successfulModels = [gpt4oResult, claudeResult, geminiResult].filter(r => r !== null).length;

    console.log(`✅ Multi-Model Generation Complete:`);
    console.log(`   ⏱️  Total time: ${totalTiming}ms`);
    console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   ✓  Successful models: ${successfulModels}/3`);

    if (gpt4oResult) console.log(`   🤖 GPT-4o: ${gpt4oResult.questions.length} questions (${gpt4oResult.timing}ms, $${gpt4oResult.cost.toFixed(4)})`);
    if (claudeResult) console.log(`   🤖 Claude: ${claudeResult.questions.length} questions (${claudeResult.timing}ms, $${claudeResult.cost.toFixed(4)})`);
    if (geminiResult) console.log(`   🤖 Gemini: ${geminiResult.questions.length} questions (${geminiResult.timing}ms, $${geminiResult.cost.toFixed(4)})`);

    return {
      gpt4o: gpt4oResult,
      claude: claudeResult,
      gemini: geminiResult,
      totalCost,
      totalTiming,
      errors
    };
  }

  /**
   * Generate questions using GPT-4o
   */
  private async generateWithGPT4o(transcript: string): Promise<ModelGenerationResult> {
    const start = Date.now();
    const systemPrompt = this.buildSystemPrompt();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this transcript:\n\n${transcript}` }
        ],
        temperature: this.config.gpt4o.temperature,
        max_tokens: this.config.gpt4o.max_tokens,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(this.config.gpt4o.timeout)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const timing = Date.now() - start;

    const usage: UsageMetadata = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const cost = this.calculateCost('gpt-4o', usage);

    const analysis: TranscriptAnalysis = JSON.parse(data.choices[0].message.content);

    // Add source_model to each question
    const questionsWithSource = analysis.questions.map(q => ({
      ...q,
      source_model: 'gpt-4o' as const
    }));

    return {
      questions: questionsWithSource,
      analysis,
      cost,
      timing,
      model: 'gpt-4o'
    };
  }

  /**
   * Generate questions using Claude (Anthropic)
   */
  private async generateWithClaude(transcript: string): Promise<ModelGenerationResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic SDK not initialized');
    }

    const start = Date.now();
    const systemPrompt = this.buildSystemPrompt();

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.claude.max_tokens,
      temperature: this.config.claude.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this transcript:\n\n${transcript}`
        }
      ]
    });

    const timing = Date.now() - start;

    const usage: UsageMetadata = {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens
    };
    const cost = this.calculateCost('claude', usage);

    // Parse JSON from first content block
    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const analysis: TranscriptAnalysis = JSON.parse(analysisText);

    // Add source_model to each question
    const questionsWithSource = analysis.questions.map(q => ({
      ...q,
      source_model: 'claude' as const
    }));

    return {
      questions: questionsWithSource,
      analysis,
      cost,
      timing,
      model: 'claude'
    };
  }

  /**
   * Generate questions using Gemini
   */
  private async generateWithGemini(transcript: string): Promise<ModelGenerationResult> {
    if (!this.gemini) {
      throw new Error('Gemini SDK not initialized');
    }

    const start = Date.now();
    const systemPrompt = this.buildSystemPrompt();

    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: this.config.gemini.temperature,
        maxOutputTokens: this.config.gemini.max_tokens,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent([
      systemPrompt,
      `Analyze this transcript:\n\n${transcript}`
    ]);

    const timing = Date.now() - start;

    const usage: UsageMetadata = {
      prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
      completion_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: result.response.usageMetadata?.totalTokenCount || 0
    };
    const cost = this.calculateCost('gemini', usage);

    const analysis: TranscriptAnalysis = JSON.parse(result.response.text());

    // Add source_model to each question
    const questionsWithSource = analysis.questions.map(q => ({
      ...q,
      source_model: 'gemini' as const
    }));

    return {
      questions: questionsWithSource,
      analysis,
      cost,
      timing,
      model: 'gemini'
    };
  }

  /**
   * Calculate API cost based on token usage
   */
  private calculateCost(model: AIModel, usage: UsageMetadata): number {
    const pricing = MODEL_PRICING[model];
    const inputCost = usage.prompt_tokens * pricing.input;
    const outputCost = usage.completion_tokens * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Build the system prompt used by all models
   * This is the enhanced Phase 1 prompt with Chain-of-Thought reasoning
   */
  private buildSystemPrompt(): string {
    return `You are Producer AI, an expert broadcast producer analyzing live philosophical discussions.

<task>
Analyze the conversation transcript and generate 2-4 high-quality follow-up questions that will:
1. Deepen intellectual discourse (not surface-level)
2. Challenge assumptions or explore counterpoints
3. Connect to broader themes or real-world examples
4. Engage both panelists and audience
</task>

<context>
Show: "Abe I Stream"
Format: Philosophical/cultural discussion livestream
Audience: Intellectually curious viewers seeking depth
Host Style: Socratic questioning, values nuance over quick takes
</context>

<thinking>
Use this reasoning framework:

Step 1: TOPIC IDENTIFICATION
- What is the core topic being discussed?
- What are the 2-3 main arguments or viewpoints?
- What assumptions are being made?

Step 2: CONVERSATION MOMENTUM
- Is the discussion deepening or becoming repetitive?
- Are there unexplored angles or counterarguments?
- Has the topic been exhausted? (check for circular reasoning)

Step 3: QUESTION GENERATION
For each potential question, evaluate:
- Intellectual depth: Does it move beyond obvious responses?
- Engagement potential: Will it spark interesting discussion?
- Relevance: Does it naturally follow from the conversation?
- Practical applicability: Can it connect to real-world examples?

Assign confidence based on:
- High (0.8-1.0): Question builds on established context, addresses gap in discussion
- Medium (0.6-0.79): Question is relevant but somewhat tangential
- Low (0.4-0.59): Question might disrupt flow or be too basic
</thinking>

<output_format>
{
  "reasoning_chain": {
    "topic_identification": "Brief summary of core topic",
    "conversation_state": "deepening | plateau | exhausted",
    "unexplored_angles": ["angle 1", "angle 2"],
    "momentum_assessment": "Explanation of current conversation momentum"
  },
  "topic_summary": "One-sentence summary",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "questions": [
    {
      "question_text": "The actual question",
      "confidence": 0.85,
      "reasoning": "Why this question is valuable (specific to current conversation)",
      "context_summary": "What in the transcript led to this question",
      "expected_direction": "What type of discussion this might spark",
      "quality_score": {
        "depth": 0.9,
        "engagement": 0.8,
        "relevance": 0.85,
        "practicality": 0.7
      }
    }
  ],
  "segment_recommendation": {
    "should_transition": false,
    "reason": "Specific reason based on conversation analysis",
    "confidence": 0.75
  }
}
</output_format>

<quality_criteria>
EXCELLENT questions (0.8+):
- Build on specific points made in transcript
- Introduce productive tension or counterpoint
- Have clear relevance to broader themes
- Likely to generate 3+ minutes of quality discussion

GOOD questions (0.6-0.79):
- Relevant to general topic
- May deepen one aspect of discussion
- Somewhat predictable but valuable

WEAK questions (below 0.6):
- Generic or could apply to any similar discussion
- Simple yes/no or factual questions
- Disrupt conversation flow
- Too obvious or surface-level
</quality_criteria>

Generate 2-4 questions maximum. Prioritize quality over quantity.`;
  }
}
