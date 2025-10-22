/**
 * Multi-Model AI Fusion
 *
 * Queries multiple AI models in parallel and synthesizes responses
 * for higher quality answers
 */

export interface ModelResponse {
  model: 'gpt4' | 'claude' | 'perplexity';
  response: string;
  responseTime: number; // milliseconds
  error?: string;
}

export interface SynthesizedResponse {
  finalAnswer: string;
  modelsUsed: string[];
  synthesisReasoning: string;
  confidence: number; // 0-1
  totalTime: number; // milliseconds
}

/**
 * Query GPT-4 (OpenAI)
 */
async function queryGPT4(
  prompt: string,
  systemPrompt: string = 'You are Beta Bot, an AI co-host for a professional live stream.'
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`GPT-4 API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';

    return {
      model: 'gpt4',
      response: answer,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      model: 'gpt4',
      response: '',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Query Claude (Anthropic)
 */
async function queryClaude(
  prompt: string,
  systemPrompt: string = 'You are Beta Bot, an AI co-host for a professional live stream.'
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.content?.[0]?.text || '';

    return {
      model: 'claude',
      response: answer,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      model: 'claude',
      response: '',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Query Perplexity (for real-time/research questions)
 */
async function queryPerplexity(
  prompt: string,
  systemPrompt: string = 'You are Beta Bot, an AI co-host. Provide concise, accurate, up-to-date answers.'
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';

    return {
      model: 'perplexity',
      response: answer,
      responseTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      model: 'perplexity',
      response: '',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Synthesize multiple model responses into one best answer
 */
async function synthesizeResponses(
  question: string,
  responses: ModelResponse[]
): Promise<SynthesizedResponse> {
  const validResponses = responses.filter(r => r.response && !r.error);

  if (validResponses.length === 0) {
    return {
      finalAnswer: 'I apologize, but I encountered an error processing your question.',
      modelsUsed: [],
      synthesisReasoning: 'All models failed to respond',
      confidence: 0,
      totalTime: 0
    };
  }

  // If only one model responded, use it directly
  if (validResponses.length === 1) {
    return {
      finalAnswer: validResponses[0].response,
      modelsUsed: [validResponses[0].model],
      synthesisReasoning: 'Single model response',
      confidence: 0.8,
      totalTime: validResponses[0].responseTime
    };
  }

  // Use GPT-4 to synthesize multiple responses
  try {
    const synthesisPrompt = `
You are synthesizing answers from multiple AI models to create the best possible response.

ORIGINAL QUESTION:
${question}

MODEL RESPONSES:
${validResponses.map((r, i) => `
${i + 1}. ${r.model.toUpperCase()}:
${r.response}
`).join('\n')}

TASK:
Synthesize these responses into ONE concise, accurate answer (2-3 sentences max).
- Combine the best insights from each model
- Remove redundancy and contradictions
- Maintain a conversational, engaging tone
- Prioritize accuracy over politeness

SYNTHESIZED ANSWER:`;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at synthesizing multiple AI responses into one optimal answer. Be concise and accurate.'
          },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.5,
        max_tokens: 250
      })
    });

    const data = await response.json();
    const synthesizedAnswer = data.choices?.[0]?.message?.content || validResponses[0].response;

    const totalTime = Math.max(...validResponses.map(r => r.responseTime));

    return {
      finalAnswer: synthesizedAnswer,
      modelsUsed: validResponses.map(r => r.model),
      synthesisReasoning: `Synthesized ${validResponses.length} model responses`,
      confidence: 0.95, // High confidence when multiple models agree
      totalTime
    };

  } catch (error) {
    console.error('Synthesis error:', error);
    // Fallback: use the fastest response
    const fastestResponse = validResponses.reduce((prev, curr) =>
      curr.responseTime < prev.responseTime ? curr : prev
    );

    return {
      finalAnswer: fastestResponse.response,
      modelsUsed: [fastestResponse.model],
      synthesisReasoning: 'Synthesis failed, using fastest model',
      confidence: 0.7,
      totalTime: fastestResponse.responseTime
    };
  }
}

/**
 * Multi-model query with fusion
 * Queries 2 models in parallel and synthesizes the best response
 *
 * NOTE: Perplexity removed from auto-selection. Use explicit "Alakazam"
 * keyword activation for searches instead.
 */
export async function multiModelQuery(
  question: string,
  options: {
    systemPrompt?: string;
    models?: Array<'gpt4' | 'claude' | 'perplexity'>;
    requireRealTime?: boolean;
  } = {}
): Promise<SynthesizedResponse> {
  const {
    systemPrompt = 'You are Beta Bot, an AI co-host for a professional live stream.',
    models = ['gpt4', 'claude'], // Default: GPT-4 + Claude (NO Perplexity)
    requireRealTime = false
  } = options;

  console.log(`🔄 Multi-model query: ${models.join(', ')}`);

  // WARNING: Real-time data flag has been deprecated
  // Use "Alakazam" keyword for Perplexity searches instead
  if (requireRealTime) {
    console.warn('⚠️ requireRealTime flag is deprecated. Use "Alakazam" keyword for searches.');
  }

  const modelsToQuery = models;

  // Query models in parallel
  const queries: Promise<ModelResponse>[] = [];

  if (modelsToQuery.includes('gpt4')) {
    queries.push(queryGPT4(question, systemPrompt));
  }
  if (modelsToQuery.includes('claude')) {
    queries.push(queryClaude(question, systemPrompt));
  }
  if (modelsToQuery.includes('perplexity')) {
    queries.push(queryPerplexity(question, systemPrompt));
  }

  // Wait for all models to respond (or timeout)
  const startTime = Date.now();
  const responses = await Promise.all(queries);
  const queryTime = Date.now() - startTime;

  console.log(`✅ Multi-model responses received in ${queryTime}ms`);
  responses.forEach(r => {
    if (r.error) {
      console.error(`❌ ${r.model} error:`, r.error);
    } else {
      console.log(`✅ ${r.model}: ${r.response.substring(0, 100)}...`);
    }
  });

  // Synthesize responses
  const synthesized = await synthesizeResponses(question, responses);

  console.log(`🎯 Synthesized answer from ${synthesized.modelsUsed.join(', ')}`);

  return synthesized;
}

/**
 * Smart model selection based on question type
 *
 * NOTE: Perplexity has been removed from auto-selection to prevent
 * accidental searches mid-conversation. Perplexity should ONLY be
 * used via explicit "Alakazam" keyword activation.
 */
export function selectModelsForQuestion(question: string): Array<'gpt4' | 'claude'> {
  const lowerQuestion = question.toLowerCase();

  // Creative/conversational questions -> Claude + GPT-4
  const creativeKeywords = [
    'explain', 'tell me about', 'what do you think',
    'opinion', 'creative', 'story', 'imagine'
  ];
  if (creativeKeywords.some(kw => lowerQuestion.includes(kw))) {
    return ['claude', 'gpt4'];
  }

  // Default -> GPT-4 + Claude (NO PERPLEXITY - use "Alakazam" keyword instead)
  return ['gpt4', 'claude'];
}
