/**
 * FollowUpChainGenerator - Phase 4: Intelligent Question Evolution
 *
 * Generates coherent follow-up question chains that build on previous questions
 * and create natural conversation flow.
 *
 * Key Features:
 * - Multi-level follow-up generation (depth 1-3)
 * - Conditional follow-ups based on expected responses
 * - Relevance and novelty scoring
 * - Branch exploration (multiple follow-up paths)
 * - Question chain persistence
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QuestionChain } from './types';
import { GeneratedQuestion } from '../../hooks/useProducerAI';
import { getEmbedding, cosineSimilarity } from './SemanticSimilarity';

export interface FollowUpGenerationOptions {
  maxDepth: number;           // How many levels deep to generate
  branchesPerLevel: number;   // How many alternatives per level
  minRelevanceScore: number;  // Minimum relevance to parent
  includeConditionals: boolean; // Generate conditional logic
}

export interface FollowUpChainTree {
  rootQuestion: GeneratedQuestion;
  chains: QuestionChain[];
  totalFollowUps: number;
  maxDepth: number;
}

const DEFAULT_OPTIONS: FollowUpGenerationOptions = {
  maxDepth: 2,
  branchesPerLevel: 2,
  minRelevanceScore: 0.7,
  includeConditionals: true
};

export class FollowUpChainGenerator {
  private supabase: SupabaseClient;
  private openaiApiKey: string;

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Generate a complete follow-up chain for a root question
   */
  async generateChain(
    rootQuestion: GeneratedQuestion,
    context: string,
    options: Partial<FollowUpGenerationOptions> = {}
  ): Promise<FollowUpChainTree> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const chains: QuestionChain[] = [];
    const rootQuestionId = crypto.randomUUID();

    // Generate follow-ups level by level
    for (let depth = 1; depth <= opts.maxDepth; depth++) {
      if (depth === 1) {
        // First level: generate follow-ups to root question
        const followUps = await this.generateFollowUps(
          rootQuestion.question_text,
          context,
          opts.branchesPerLevel,
          opts.includeConditionals
        );

        followUps.forEach((followUp, branchIndex) => {
          const chain: QuestionChain = {
            id: crypto.randomUUID(),
            rootQuestionId,
            followUpQuestion: followUp.question,
            depth: 1,
            branchIndex,
            condition: followUp.condition,
            reasoning: followUp.reasoning,
            expectedOutcome: followUp.expectedOutcome,
            relevanceScore: followUp.relevanceScore,
            noveltyScore: followUp.noveltyScore,
            wasUsed: false,
            createdAt: new Date()
          };

          chains.push(chain);
        });
      } else {
        // Deeper levels: generate follow-ups to previous level's questions
        const previousLevel = chains.filter(c => c.depth === depth - 1);

        for (const parentChain of previousLevel) {
          const followUps = await this.generateFollowUps(
            parentChain.followUpQuestion,
            context,
            Math.max(1, Math.floor(opts.branchesPerLevel / depth)), // Fewer branches at deeper levels
            opts.includeConditionals
          );

          followUps.forEach((followUp, branchIndex) => {
            const chain: QuestionChain = {
              id: crypto.randomUUID(),
              rootQuestionId,
              parentQuestionId: parentChain.id,
              followUpQuestion: followUp.question,
              depth,
              branchIndex,
              condition: followUp.condition,
              reasoning: followUp.reasoning,
              expectedOutcome: followUp.expectedOutcome,
              relevanceScore: followUp.relevanceScore,
              noveltyScore: followUp.noveltyScore,
              wasUsed: false,
              createdAt: new Date()
            };

            chains.push(chain);
          });
        }
      }
    }

    // Save chains to database
    await this.saveChains(chains);

    return {
      rootQuestion,
      chains,
      totalFollowUps: chains.length,
      maxDepth: opts.maxDepth
    };
  }

  /**
   * Get follow-up suggestions for a question that was just asked
   */
  async getFollowUpSuggestions(
    questionText: string,
    rootQuestionId?: string
  ): Promise<QuestionChain[]> {
    // First check database for existing chains
    if (rootQuestionId) {
      const { data: existingChains } = await this.supabase
        .from('question_chains')
        .select('*')
        .eq('root_question_id', rootQuestionId)
        .eq('was_used', false)
        .order('relevance_score', { ascending: false })
        .limit(3);

      if (existingChains && existingChains.length > 0) {
        return existingChains.map(this.dbToChain);
      }
    }

    // Generate new follow-ups on the fly
    const followUps = await this.generateFollowUps(questionText, '', 3, false);

    return followUps.map((fu, idx) => ({
      id: crypto.randomUUID(),
      rootQuestionId,
      followUpQuestion: fu.question,
      depth: 1,
      branchIndex: idx,
      condition: fu.condition,
      reasoning: fu.reasoning,
      expectedOutcome: fu.expectedOutcome,
      relevanceScore: fu.relevanceScore,
      noveltyScore: fu.noveltyScore,
      wasUsed: false,
      createdAt: new Date()
    }));
  }

  /**
   * Mark a follow-up as used
   */
  async markFollowUpUsed(chainId: string): Promise<void> {
    await this.supabase
      .from('question_chains')
      .update({ was_used: true, used_at: new Date().toISOString() })
      .eq('id', chainId);
  }

  /**
   * Get chain statistics
   */
  async getChainStats(rootQuestionId: string): Promise<{
    totalGenerated: number;
    totalUsed: number;
    usageRate: number;
    avgDepth: number;
  }> {
    const { data: chains } = await this.supabase
      .from('question_chains')
      .select('*')
      .eq('root_question_id', rootQuestionId);

    if (!chains || chains.length === 0) {
      return { totalGenerated: 0, totalUsed: 0, usageRate: 0, avgDepth: 0 };
    }

    const totalUsed = chains.filter(c => c.was_used).length;
    const avgDepth = chains.reduce((sum, c) => sum + (c.depth || 0), 0) / chains.length;

    return {
      totalGenerated: chains.length,
      totalUsed,
      usageRate: totalUsed / chains.length,
      avgDepth
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Generate follow-up questions using OpenAI
   */
  private async generateFollowUps(
    parentQuestion: string,
    context: string,
    count: number,
    includeConditionals: boolean
  ): Promise<Array<{
    question: string;
    condition?: string;
    reasoning: string;
    expectedOutcome: string;
    relevanceScore: number;
    noveltyScore: number;
  }>> {
    const systemPrompt = `You are an expert at generating follow-up questions for intellectual discussions.

Given a parent question and context, generate ${count} high-quality follow-up questions that:
1. Build directly on the parent question
2. Explore different angles or implications
3. Deepen the discussion (not just clarifying questions)
4. Are distinct from each other

${includeConditionals ? `For each follow-up, consider:
- Under what condition this follow-up makes sense
- What type of response it might generate
- Why this follow-up is valuable` : ''}

Return your response as JSON array of follow-up objects.`;

    const userPrompt = `Parent Question: "${parentQuestion}"

${context ? `Context: ${context}` : ''}

Generate ${count} follow-up questions.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        console.error('[FollowUpChain] OpenAI API error:', response.statusText);
        return this.generateFallbackFollowUps(parentQuestion, count);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return this.generateFallbackFollowUps(parentQuestion, count);
      }

      const parsed = JSON.parse(content);
      const followUps = parsed.followUps || parsed.questions || [];

      // Score each follow-up
      const scored = await Promise.all(
        followUps.slice(0, count).map(async (fu: any) => {
          const questionText = fu.question || fu.text || fu;

          // Calculate relevance score using embeddings
          const [parentEmbed, followUpEmbed] = await Promise.all([
            getEmbedding(parentQuestion),
            getEmbedding(questionText)
          ]);

          const relevanceScore = cosineSimilarity(parentEmbed, followUpEmbed);

          return {
            question: questionText,
            condition: fu.condition,
            reasoning: fu.reasoning || 'Deepens the discussion',
            expectedOutcome: fu.expectedOutcome || 'Further exploration of the topic',
            relevanceScore,
            noveltyScore: 0.7 // Default novelty
          };
        })
      );

      return scored;

    } catch (error) {
      console.error('[FollowUpChain] Error generating follow-ups:', error);
      return this.generateFallbackFollowUps(parentQuestion, count);
    }
  }

  /**
   * Generate simple rule-based follow-ups as fallback
   */
  private generateFallbackFollowUps(
    parentQuestion: string,
    count: number
  ): Array<{
    question: string;
    condition?: string;
    reasoning: string;
    expectedOutcome: string;
    relevanceScore: number;
    noveltyScore: number;
  }> {
    const templates = [
      {
        question: `Can you elaborate on that point?`,
        reasoning: 'Seeks deeper explanation',
        expectedOutcome: 'More detailed response'
      },
      {
        question: `What are the implications of what you just said?`,
        reasoning: 'Explores consequences',
        expectedOutcome: 'Discussion of broader impact'
      },
      {
        question: `How does this connect to what we discussed earlier?`,
        reasoning: 'Links to previous context',
        expectedOutcome: 'Synthesis of ideas'
      },
      {
        question: `What would be a counterargument to that?`,
        reasoning: 'Introduces opposing view',
        expectedOutcome: 'Balanced discussion'
      },
      {
        question: `Can you give a concrete example?`,
        reasoning: 'Grounds abstract in specific',
        expectedOutcome: 'Real-world illustration'
      }
    ];

    return templates.slice(0, count).map(template => ({
      ...template,
      relevanceScore: 0.6,
      noveltyScore: 0.5
    }));
  }

  /**
   * Save chains to database
   */
  private async saveChains(chains: QuestionChain[]): Promise<void> {
    if (chains.length === 0) return;

    const dbChains = chains.map(chain => ({
      id: chain.id,
      root_question_id: chain.rootQuestionId,
      parent_question_id: chain.parentQuestionId,
      follow_up_question: chain.followUpQuestion,
      depth: chain.depth,
      branch_index: chain.branchIndex,
      condition: chain.condition,
      reasoning: chain.reasoning,
      expected_outcome: chain.expectedOutcome,
      relevance_score: chain.relevanceScore,
      novelty_score: chain.noveltyScore,
      was_used: chain.wasUsed,
      used_at: chain.usedAt?.toISOString(),
      created_at: chain.createdAt.toISOString()
    }));

    const { error } = await this.supabase
      .from('question_chains')
      .insert(dbChains);

    if (error) {
      console.error('[FollowUpChain] Error saving chains:', error);
    } else {
      console.log(`[FollowUpChain] Saved ${chains.length} follow-up chains`);
    }
  }

  /**
   * Convert database record to QuestionChain
   */
  private dbToChain(dbChain: any): QuestionChain {
    return {
      id: dbChain.id,
      rootQuestionId: dbChain.root_question_id,
      parentQuestionId: dbChain.parent_question_id,
      followUpQuestion: dbChain.follow_up_question,
      depth: dbChain.depth,
      branchIndex: dbChain.branch_index,
      condition: dbChain.condition,
      reasoning: dbChain.reasoning,
      expectedOutcome: dbChain.expected_outcome,
      relevanceScore: dbChain.relevance_score,
      noveltyScore: dbChain.novelty_score,
      wasUsed: dbChain.was_used,
      usedAt: dbChain.used_at ? new Date(dbChain.used_at) : undefined,
      createdAt: new Date(dbChain.created_at)
    };
  }
}
