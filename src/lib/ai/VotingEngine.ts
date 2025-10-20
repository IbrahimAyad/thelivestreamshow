/**
 * Voting Engine
 * Deduplicates and ranks questions from multiple AI models using semantic similarity
 * Phase 3: Now includes context memory to prevent question repetition across analyses
 * Phase 4: Now includes host profile scoring for personalized question ranking
 */

import { GeneratedQuestion } from '../../hooks/useProducerAI';
import { VotedQuestion, VotingConfig, AIModel, NoveltyScore } from './types';
import { getEmbedding, getBatchEmbeddings, cosineSimilarity } from './SemanticSimilarity';
import { ContextMemoryManager } from './ContextMemoryManager';
import { HostProfileManager } from './HostProfileManager';

export class VotingEngine {
  private config: VotingConfig;
  private contextMemory: ContextMemoryManager | null;
  private hostProfile: HostProfileManager | null;

  constructor(
    config: VotingConfig,
    contextMemory?: ContextMemoryManager,
    hostProfile?: HostProfileManager
  ) {
    this.config = config;
    this.contextMemory = contextMemory || null;
    this.hostProfile = hostProfile || null;
  }

  /**
   * Main ranking function:
   * 1. Deduplicates similar questions (within batch)
   * 2. Filters against context memory (Phase 3)
   * 3. Performs cross-model voting (simulated for now)
   * 4. Calculates diversity + novelty scores (Phase 3)
   * 5. Calculates host fit scores (NEW Phase 4)
   * 6. Ranks questions by weighted final score (quality + diversity + novelty + host fit)
   */
  async rankQuestions(
    allQuestions: Array<GeneratedQuestion & { source_model?: AIModel }>
  ): Promise<VotedQuestion[]> {
    console.log(`🗳️ Voting Engine: Starting with ${allQuestions.length} questions from ${this.countModels(allQuestions)} models`);

    if (allQuestions.length === 0) {
      return [];
    }

    // Step 1: Deduplicate similar questions within current batch
    const deduped = await this.deduplicateQuestions(allQuestions);
    console.log(`✅ After deduplication: ${deduped.length} unique questions (removed ${allQuestions.length - deduped.length})`);

    // Step 2: Check against context memory (Phase 3)
    const filtered = await this.filterByContextMemory(deduped);
    console.log(`📚 After context memory filter: ${filtered.length} questions (${deduped.length - filtered.length} too similar to history)`);

    // Step 3: Cross-model voting (simulated)
    const voted = this.performVoting(filtered);
    console.log(`🎯 Voting complete: average score ${this.calculateAverageScore(voted).toFixed(2)}`);

    // Step 4: Calculate diversity + novelty (Phase 3 update)
    const withScores = await this.calculateDiversityAndNovelty(voted);
    console.log(`🌈 Diversity calculated: average ${this.calculateAverageDiversity(withScores).toFixed(2)}`);

    // Step 5: Calculate host fit scores (Phase 4)
    const withHostFit = this.calculateHostFitScores(withScores);
    if (this.hostProfile) {
      console.log(`👤 Host fit calculated: average ${this.calculateAverageHostFit(withHostFit).toFixed(2)}`);
    }

    // Step 6: Final ranking with all scoring factors
    const ranked = this.calculateFinalScores(withHostFit);
    console.log(`🏆 Top question score: ${ranked[0]?.final_score.toFixed(2) || 'N/A'}`);

    // Return top 5
    return ranked.slice(0, 5);
  }

  /**
   * Deduplicate questions using semantic similarity
   * Questions above similarity threshold are considered duplicates
   */
  private async deduplicateQuestions(
    questions: Array<GeneratedQuestion & { source_model?: AIModel }>
  ): Promise<Array<GeneratedQuestion & { source_model?: AIModel }>> {
    // Get embeddings for all questions in batch (more efficient)
    const questionTexts = questions.map(q => q.question_text);
    const embeddings = await getBatchEmbeddings(questionTexts);

    const unique: Array<GeneratedQuestion & { source_model?: AIModel }> = [];
    const duplicateIndices = new Set<number>();

    for (let i = 0; i < questions.length; i++) {
      if (duplicateIndices.has(i)) continue;

      let isDuplicate = false;

      // Compare with already accepted unique questions
      for (let j = 0; j < unique.length; j++) {
        const uniqueEmbedding = embeddings[questions.indexOf(unique[j])];
        const currentEmbedding = embeddings[i];

        const similarity = cosineSimilarity(currentEmbedding, uniqueEmbedding);

        if (similarity >= this.config.similarity_threshold) {
          isDuplicate = true;
          console.log(`🔗 Deduped: "${questions[i].question_text.slice(0, 60)}..." (${(similarity * 100).toFixed(0)}% similar)`);
          console.log(`   Original: "${unique[j].question_text.slice(0, 60)}..."`);
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(questions[i]);
      } else {
        duplicateIndices.add(i);
      }
    }

    return unique;
  }

  /**
   * Perform cross-model voting
   * In a full implementation, this would re-query each model to score other models' questions
   * For now, we simulate voting based on confidence scores with some variance
   */
  private performVoting(
    questions: Array<GeneratedQuestion & { source_model?: AIModel }>
  ): VotedQuestion[] {
    return questions.map(q => {
      const baseScore = q.confidence || 0.7;
      const variance = 0.1;

      // Simulate cross-model voting with slight variance
      // In production, you'd actually query each model to score this question
      const gpt4o_score = this.clamp(baseScore + (Math.random() - 0.5) * variance, 0, 1);
      const claude_score = this.clamp(baseScore + (Math.random() - 0.5) * variance, 0, 1);
      const gemini_score = this.clamp(baseScore + (Math.random() - 0.5) * variance, 0, 1);

      const average = (gpt4o_score + claude_score + gemini_score) / 3;

      return {
        question: q,
        sourceModel: (q.source_model || 'gpt-4o') as AIModel,
        votes: {
          gpt4o_score,
          claude_score,
          gemini_score,
          average
        },
        diversity_score: 0, // Calculated next
        final_score: 0, // Calculated last
        similar_to: []
      };
    });
  }

  /**
   * Filter questions against context memory (Phase 3)
   * Removes questions too similar to recent history
   * Penalizes moderately similar questions
   */
  private async filterByContextMemory(
    questions: Array<GeneratedQuestion & { source_model?: AIModel }>
  ): Promise<Array<GeneratedQuestion & { source_model?: AIModel; noveltyScore?: number }>> {
    if (!this.contextMemory) {
      // No context memory, return all questions
      return questions;
    }

    const filtered: Array<GeneratedQuestion & { source_model?: AIModel; noveltyScore?: number }> = [];

    for (const question of questions) {
      // Check similarity against context memory
      const similarityCheck = await this.contextMemory.checkSimilarity(question.question_text);

      if (similarityCheck.shouldFilter) {
        // Question is too similar to recent history - completely filter it
        console.log(`🚫 Filtered: "${question.question_text.slice(0, 50)}..." (${(similarityCheck.similarity * 100).toFixed(0)}% similar to "${similarityCheck.mostSimilarQuestion?.slice(0, 30)}..." from ${similarityCheck.timeAgo.toFixed(0)}min ago)`);
        continue;
      }

      // Calculate novelty score for this question
      const novelty = await this.contextMemory.calculateNoveltyScore(question.question_text);

      // Keep question with novelty score attached
      filtered.push({
        ...question,
        noveltyScore: novelty.score
      });

      if (similarityCheck.shouldPenalize) {
        console.log(`⚠️  Penalized: "${question.question_text.slice(0, 50)}..." (${(similarityCheck.similarity * 100).toFixed(0)}% similar, novelty: ${(novelty.score * 100).toFixed(0)}%)`);
      } else if (similarityCheck.shouldBoost) {
        console.log(`✨ Novel: "${question.question_text.slice(0, 50)}..." (novelty: ${(novelty.score * 100).toFixed(0)}%)`);
      }
    }

    return filtered;
  }

  /**
   * Calculate diversity score for each question
   * Measures how different this question is from others
   * Higher diversity = explores unique angles
   */
  private calculateDiversity(voted: VotedQuestion[]): VotedQuestion[] {
    return voted.map((q, i) => {
      if (voted.length === 1) {
        // Only one question, max diversity
        return { ...q, diversity_score: 1.0 };
      }

      let diversitySum = 0;
      let comparisons = 0;

      for (let j = 0; j < voted.length; j++) {
        if (i === j) continue;

        // Simple word overlap diversity
        const q1Words = new Set(
          q.question.question_text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
        );
        const q2Words = new Set(
          voted[j].question.question_text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
        );

        const intersection = new Set([...q1Words].filter(w => q2Words.has(w)));
        const union = new Set([...q1Words, ...q2Words]);
        const overlap = intersection.size / union.size;

        // Diversity is inverse of overlap
        diversitySum += (1 - overlap);
        comparisons++;
      }

      const diversity_score = comparisons > 0 ? diversitySum / comparisons : 0.5;

      return {
        ...q,
        diversity_score
      };
    });
  }

  /**
   * Calculate diversity AND novelty scores (Phase 3)
   * Combines existing diversity calculation with novelty from context memory
   */
  private async calculateDiversityAndNovelty(voted: VotedQuestion[]): Promise<VotedQuestion[]> {
    // First calculate diversity scores (as before)
    const withDiversity = this.calculateDiversity(voted);

    // If no context memory, return with diversity only
    if (!this.contextMemory) {
      return withDiversity;
    }

    // Novelty scores were already calculated in filterByContextMemory
    // Just pass them through (they're attached to question.noveltyScore)
    return withDiversity.map(vq => ({
      ...vq,
      // Add novelty_score field for final scoring
      novelty_score: (vq.question as any).noveltyScore || 0.5 // Default to 0.5 if no novelty score
    }));
  }

  /**
   * Calculate host fit scores for each question (Phase 4)
   * Uses HostProfileManager to score how well each question fits the host's preferences
   */
  private calculateHostFitScores(voted: VotedQuestion[]): VotedQuestion[] {
    if (!this.hostProfile) {
      // No host profile, add neutral fit scores
      return voted.map(q => ({
        ...q,
        host_fit_score: 0.5
      }));
    }

    return voted.map(q => {
      const hostFitScore = this.hostProfile!.calculateHostFitScore(q.question);

      return {
        ...q,
        host_fit_score: hostFitScore
      };
    });
  }

  /**
   * Calculate final scores and sort (Phase 4 updated)
   * Final score = (quality × 0.5) + (diversity × 0.15) + (novelty × 0.15) + (host_fit × 0.2)
   *
   * Weights progression:
   * Phase 2: Quality 70%, Diversity 30%
   * Phase 3: Quality 60%, Diversity 20%, Novelty 20%
   * Phase 4: Quality 50%, Diversity 15%, Novelty 15%, Host Fit 20%
   */
  private calculateFinalScores(voted: VotedQuestion[]): VotedQuestion[] {
    // Phase 4 weights (if host profile enabled)
    const hasHostProfile = this.hostProfile !== null;

    const qualityWeight = hasHostProfile ? 0.5 : 0.6;
    const diversityWeight = hasHostProfile ? 0.15 : 0.2;
    const noveltyWeight = hasHostProfile ? 0.15 : 0.2;
    const hostFitWeight = hasHostProfile ? 0.2 : 0.0;

    return voted
      .map(q => {
        const novelty = (q as any).novelty_score || 0.5;
        const hostFit = (q as any).host_fit_score || 0.5;

        const final_score =
          (q.votes.average * qualityWeight) +
          (q.diversity_score * diversityWeight) +
          (novelty * noveltyWeight) +
          (hostFit * hostFitWeight);

        return {
          ...q,
          final_score
        };
      })
      .sort((a, b) => b.final_score - a.final_score);
  }

  /**
   * Count unique models in question set
   */
  private countModels(questions: Array<GeneratedQuestion & { source_model?: AIModel }>): number {
    const models = new Set(questions.map(q => q.source_model).filter(Boolean));
    return models.size;
  }

  /**
   * Calculate average vote score
   */
  private calculateAverageScore(voted: VotedQuestion[]): number {
    if (voted.length === 0) return 0;
    const sum = voted.reduce((acc, q) => acc + q.votes.average, 0);
    return sum / voted.length;
  }

  /**
   * Calculate average diversity score
   */
  private calculateAverageDiversity(voted: VotedQuestion[]): number {
    if (voted.length === 0) return 0;
    const sum = voted.reduce((acc, q) => acc + q.diversity_score, 0);
    return sum / voted.length;
  }

  /**
   * Calculate average host fit score (Phase 4)
   */
  private calculateAverageHostFit(voted: any[]): number {
    if (voted.length === 0) return 0;
    const sum = voted.reduce((acc, q) => acc + (q.host_fit_score || 0.5), 0);
    return sum / voted.length;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
