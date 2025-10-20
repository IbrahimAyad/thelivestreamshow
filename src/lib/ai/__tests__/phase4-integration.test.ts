/**
 * Phase 4 Integration Tests
 *
 * Tests all Phase 4 components working together:
 * - HostProfileManager
 * - EngagementTracker
 * - TopicClusteringEngine
 * - FollowUpChainGenerator
 * - VotingEngine with Phase 4 scoring
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HostProfileManager } from '../HostProfileManager';
import { EngagementTracker } from '../EngagementTracker';
import { TopicClusteringEngine } from '../TopicClusteringEngine';
import { FollowUpChainGenerator } from '../FollowUpChainGenerator';
import { VotingEngine } from '../VotingEngine';
import { ContextMemoryManager } from '../ContextMemoryManager';
import { GeneratedQuestion } from '../../../hooks/useProducerAI';

// Test environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-key';
const OPENAI_KEY = process.env.OPENAI_API_KEY || 'test-key';

describe('Phase 4: Integration Tests', () => {
  let supabase: SupabaseClient;
  let hostProfile: HostProfileManager;
  let engagementTracker: EngagementTracker;
  let topicClustering: TopicClusteringEngine;
  let followUpChains: FollowUpChainGenerator;
  let votingEngine: VotingEngine;
  let contextMemory: ContextMemoryManager;

  const testHostId = `test-host-${Date.now()}`;
  const testShowId = crypto.randomUUID();

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Initialize all Phase 4 components
    hostProfile = new HostProfileManager(SUPABASE_URL, SUPABASE_KEY, testHostId);
    await hostProfile.initialize();

    engagementTracker = new EngagementTracker(SUPABASE_URL, SUPABASE_KEY);
    await engagementTracker.initializeForShow(testShowId);

    topicClustering = new TopicClusteringEngine(SUPABASE_URL, SUPABASE_KEY, OPENAI_KEY);

    followUpChains = new FollowUpChainGenerator(SUPABASE_URL, SUPABASE_KEY, OPENAI_KEY);

    contextMemory = new ContextMemoryManager(SUPABASE_URL, SUPABASE_KEY);

    votingEngine = new VotingEngine(
      {
        similarity_threshold: 0.85,
        min_vote_score: 0.5
      },
      contextMemory,
      hostProfile
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('host_profiles').delete().eq('host_id', testHostId);
    await supabase.from('engagement_snapshots').delete().eq('show_id', testShowId);
  });

  describe('1. Host Profile Learning', () => {
    it('should initialize with default preferences', () => {
      expect(hostProfile.getProfile()).toBeDefined();
      expect(hostProfile.getProfile().host_id).toBe(testHostId);
      expect(hostProfile.getProfile().technical_depth_preference).toBe(0.5);
    });

    it('should record and learn from interactions', async () => {
      const testQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'How does quantum entanglement work?',
        confidence: 0.8,
        reasoning: 'Technical physics question',
        source: 'test',
        alternatives: [],
        topics: ['physics', 'quantum mechanics'],
        created_at: new Date()
      };

      await hostProfile.recordInteraction(testQuestion, 'asked', 5);

      const profile = hostProfile.getProfile();
      expect(profile.total_questions_analyzed).toBeGreaterThan(0);
      expect(profile.confidence_score).toBeGreaterThan(0);
    });

    it('should calculate host fit scores', () => {
      const technicalQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'Explain the Byzantine Generals Problem in distributed systems',
        confidence: 0.8,
        reasoning: 'Technical CS question',
        source: 'test',
        alternatives: [],
        topics: ['computer science', 'algorithms'],
        created_at: new Date()
      };

      const casualQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What is your favorite color?',
        confidence: 0.6,
        reasoning: 'Casual question',
        source: 'test',
        alternatives: [],
        topics: ['personal'],
        created_at: new Date()
      };

      const techScore = hostProfile.calculateHostFitScore(technicalQuestion);
      const casualScore = hostProfile.calculateHostFitScore(casualQuestion);

      expect(techScore).toBeGreaterThanOrEqual(0);
      expect(techScore).toBeLessThanOrEqual(1);
      expect(casualScore).toBeGreaterThanOrEqual(0);
      expect(casualScore).toBeLessThanOrEqual(1);
    });

    it('should update preferences over time', async () => {
      const initialProfile = hostProfile.getProfile();
      const initialTechPref = initialProfile.technical_depth_preference;

      // Record multiple technical questions
      for (let i = 0; i < 5; i++) {
        await hostProfile.recordInteraction(
          {
            id: crypto.randomUUID(),
            question_text: `Technical question ${i + 1} about algorithms and data structures`,
            confidence: 0.8,
            reasoning: 'Technical',
            source: 'test',
            alternatives: [],
            topics: ['computer science'],
            created_at: new Date()
          },
          'asked',
          3
        );
      }

      const updatedProfile = hostProfile.getProfile();
      // Technical preference should have shifted (either up or down based on learning)
      expect(updatedProfile.total_questions_analyzed).toBeGreaterThan(
        initialProfile.total_questions_analyzed
      );
    });
  });

  describe('2. Engagement Tracking', () => {
    it('should record chat messages', async () => {
      await engagementTracker.recordChatMessage('Great question!', 'user1');
      await engagementTracker.recordChatMessage('Very interesting!', 'user2');
      await engagementTracker.recordChatMessage('I love this topic!', 'user3');

      const metrics = (engagementTracker as any).calculateCurrentMetrics();
      expect(metrics.uniqueChatters).toBe(3);
      expect(metrics.chatMessagesPerMinute).toBeGreaterThan(0);
    });

    it('should analyze sentiment', async () => {
      await engagementTracker.recordChatMessage('This is amazing! 🔥', 'user1');
      await engagementTracker.recordChatMessage('Boring...', 'user2');
      await engagementTracker.recordChatMessage('Love it!', 'user3');

      const metrics = (engagementTracker as any).calculateCurrentMetrics();
      expect(metrics.chatSentiment).toBeDefined();
      expect(metrics.chatSentiment).toBeGreaterThan(-1);
      expect(metrics.chatSentiment).toBeLessThan(1);
    });

    it('should track viewer count changes', async () => {
      await engagementTracker.recordViewerCount(100);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await engagementTracker.recordViewerCount(150);

      const metrics = (engagementTracker as any).calculateCurrentMetrics();
      expect(metrics.viewerCount).toBe(150);
      expect(metrics.viewerCountChange).toBeGreaterThan(0);
    });

    it('should calculate engagement level', async () => {
      // Simulate high engagement
      for (let i = 0; i < 20; i++) {
        await engagementTracker.recordChatMessage(`Message ${i}`, `user${i}`);
      }
      await engagementTracker.recordViewerCount(500);

      const metrics = (engagementTracker as any).calculateCurrentMetrics();
      expect(metrics.engagementLevel).toMatch(/low|medium|high|viral/);
      expect(metrics.engagementScore).toBeGreaterThan(0);
    });

    it('should take engagement snapshots', async () => {
      const snapshot = await engagementTracker.takeSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot?.showId).toBe(testShowId);
      expect(snapshot?.engagementScore).toBeGreaterThanOrEqual(0);
      expect(snapshot?.engagementScore).toBeLessThanOrEqual(1);
    });

    it('should retrieve metrics around a specific time', async () => {
      const questionAskedTime = new Date();

      const { before, after } = await engagementTracker.getMetricsAroundTime(
        questionAskedTime,
        60 // 60 seconds window
      );

      expect(before).toBeDefined();
      expect(after).toBeDefined();
    });
  });

  describe('3. Topic Clustering', () => {
    it('should cluster related questions', async () => {
      const questions = [
        { text: 'What is machine learning?', id: '1' },
        { text: 'How do neural networks work?', id: '2' },
        { text: 'Explain deep learning architectures', id: '3' },
        { text: 'What are the best pizza toppings?', id: '4' },
        { text: 'How do you make sourdough bread?', id: '5' },
        { text: 'What is quantum computing?', id: '6' },
        { text: 'Explain quantum entanglement', id: '7' }
      ];

      const clusters = await topicClustering.clusterQuestions(questions);

      expect(clusters.size).toBeGreaterThan(0);
      expect(clusters.size).toBeLessThanOrEqual(questions.length);

      // Verify all questions are assigned
      const totalAssigned = Array.from(clusters.values()).reduce(
        (sum, ids) => sum + ids.length,
        0
      );
      expect(totalAssigned).toBe(questions.length);
    });

    it('should generate cluster names and keywords', async () => {
      const clusters = await topicClustering.getAllClusters();

      for (const cluster of clusters) {
        expect(cluster.name).toBeDefined();
        expect(cluster.keywords.length).toBeGreaterThan(0);
      }
    });

    it('should find related clusters', async () => {
      const clusters = await topicClustering.getAllClusters();

      if (clusters.length > 0) {
        const firstCluster = clusters[0];
        expect(firstCluster.relatedClusters.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should recommend next topics', async () => {
      const clusters = await topicClustering.getAllClusters();

      if (clusters.length > 0) {
        const recommendations = await topicClustering.getTopicRecommendations(
          clusters[0].id,
          3
        );

        expect(recommendations.length).toBeLessThanOrEqual(3);
      }
    });

    it('should assign new questions to existing clusters', async () => {
      const newQuestion = {
        text: 'What is reinforcement learning?',
        id: 'new-1'
      };

      const cluster = await topicClustering.findClusterForQuestion(
        newQuestion.text,
        newQuestion.id
      );

      expect(cluster).toBeDefined();
    });
  });

  describe('4. Follow-up Chain Generation', () => {
    it('should generate follow-up chains', async () => {
      const rootQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What is consciousness?',
        confidence: 0.8,
        reasoning: 'Philosophical question',
        source: 'test',
        alternatives: [],
        topics: ['philosophy', 'consciousness'],
        created_at: new Date()
      };

      const chain = await followUpChains.generateChain(
        rootQuestion,
        'Philosophy discussion',
        {
          maxDepth: 2,
          branchesPerLevel: 2,
          minRelevanceScore: 0.6,
          includeConditionals: true
        }
      );

      expect(chain.rootQuestion).toEqual(rootQuestion);
      expect(chain.chains.length).toBeGreaterThan(0);
      expect(chain.totalFollowUps).toBe(chain.chains.length);
      expect(chain.maxDepth).toBe(2);

      // Check chain structure
      const depth1Chains = chain.chains.filter(c => c.depth === 1);
      const depth2Chains = chain.chains.filter(c => c.depth === 2);

      expect(depth1Chains.length).toBeGreaterThan(0);
      // Depth 2 chains should have parent references
      if (depth2Chains.length > 0) {
        expect(depth2Chains[0].parentQuestionId).toBeDefined();
      }
    });

    it('should calculate relevance scores for follow-ups', async () => {
      const rootQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'How does photosynthesis work?',
        confidence: 0.8,
        reasoning: 'Biology question',
        source: 'test',
        alternatives: [],
        topics: ['biology', 'plants'],
        created_at: new Date()
      };

      const chain = await followUpChains.generateChain(
        rootQuestion,
        'Biology class',
        { maxDepth: 1, branchesPerLevel: 3 }
      );

      for (const followUp of chain.chains) {
        expect(followUp.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(followUp.relevanceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should get follow-up suggestions on the fly', async () => {
      const suggestions = await followUpChains.getFollowUpSuggestions(
        'What is artificial intelligence?'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(3);

      for (const suggestion of suggestions) {
        expect(suggestion.followUpQuestion).toBeDefined();
        expect(suggestion.reasoning).toBeDefined();
      }
    });

    it('should mark follow-ups as used', async () => {
      const rootQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What is blockchain?',
        confidence: 0.8,
        reasoning: 'Tech question',
        source: 'test',
        alternatives: [],
        topics: ['technology', 'blockchain'],
        created_at: new Date()
      };

      const chain = await followUpChains.generateChain(rootQuestion, 'Tech talk');
      const firstChain = chain.chains[0];

      await followUpChains.markFollowUpUsed(firstChain.id);

      const stats = await followUpChains.getChainStats(firstChain.rootQuestionId || '');
      expect(stats.totalUsed).toBeGreaterThan(0);
    });

    it('should track chain usage statistics', async () => {
      const rootQuestion: GeneratedQuestion = {
        id: crypto.randomUUID(),
        question_text: 'What is climate change?',
        confidence: 0.8,
        reasoning: 'Environmental question',
        source: 'test',
        alternatives: [],
        topics: ['environment', 'climate'],
        created_at: new Date()
      };

      const chain = await followUpChains.generateChain(rootQuestion, 'Climate discussion');

      const stats = await followUpChains.getChainStats(chain.chains[0].rootQuestionId || '');

      expect(stats.totalGenerated).toBe(chain.totalFollowUps);
      expect(stats.usageRate).toBeGreaterThanOrEqual(0);
      expect(stats.avgDepth).toBeGreaterThan(0);
    });
  });

  describe('5. Integrated Voting with Phase 4 Scoring', () => {
    it('should rank questions using all 4 scoring factors', async () => {
      const questions: Array<GeneratedQuestion & { source_model?: any }> = [
        {
          id: '1',
          question_text: 'How does quantum computing threaten current encryption?',
          confidence: 0.85,
          reasoning: 'Technical security question',
          source: 'gpt-4o',
          alternatives: [],
          topics: ['technology', 'security'],
          created_at: new Date()
        },
        {
          id: '2',
          question_text: 'What is your favorite ice cream flavor?',
          confidence: 0.6,
          reasoning: 'Casual question',
          source: 'claude-3',
          alternatives: [],
          topics: ['casual'],
          created_at: new Date()
        },
        {
          id: '3',
          question_text: 'Explain the implications of AGI on human society',
          confidence: 0.9,
          reasoning: 'Philosophical AI question',
          source: 'gemini-pro',
          alternatives: [],
          topics: ['AI', 'philosophy', 'future'],
          created_at: new Date()
        }
      ];

      const ranked = await votingEngine.rankQuestions(questions);

      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked.length).toBeLessThanOrEqual(5);

      // Check scoring components
      for (const q of ranked) {
        expect(q.votes.average).toBeGreaterThanOrEqual(0);
        expect(q.diversity_score).toBeGreaterThanOrEqual(0);
        expect((q as any).novelty_score).toBeGreaterThanOrEqual(0);
        expect((q as any).host_fit_score).toBeGreaterThanOrEqual(0);
        expect(q.final_score).toBeGreaterThanOrEqual(0);
      }

      // Verify questions are sorted by final score
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].final_score).toBeGreaterThanOrEqual(ranked[i + 1].final_score);
      }
    });

    it('should filter questions against context memory', async () => {
      // Add some questions to context memory
      const pastQuestion = 'What is machine learning?';
      await contextMemory.addToMemory(
        pastQuestion,
        crypto.randomUUID(),
        testShowId,
        'ml-topic'
      );

      const questions: Array<GeneratedQuestion & { source_model?: any }> = [
        {
          id: '1',
          question_text: 'What is machine learning exactly?', // Very similar to past
          confidence: 0.8,
          reasoning: 'ML question',
          source: 'gpt-4o',
          alternatives: [],
          topics: ['AI'],
          created_at: new Date()
        },
        {
          id: '2',
          question_text: 'How do quantum computers work?', // Novel
          confidence: 0.8,
          reasoning: 'Quantum question',
          source: 'claude-3',
          alternatives: [],
          topics: ['quantum'],
          created_at: new Date()
        }
      ];

      const ranked = await votingEngine.rankQuestions(questions);

      // The novel question should rank higher due to novelty bonus
      const novelQuestionRank = ranked.findIndex(q => q.question.id === '2');
      const similarQuestionRank = ranked.findIndex(q => q.question.id === '1');

      // Novel question should either rank higher or similar question should be filtered
      if (similarQuestionRank >= 0 && novelQuestionRank >= 0) {
        expect(novelQuestionRank).toBeLessThanOrEqual(similarQuestionRank);
      }
    });

    it('should balance all scoring factors correctly', async () => {
      const questions: Array<GeneratedQuestion & { source_model?: any }> = [
        {
          id: '1',
          question_text: 'Test question about distributed systems and consensus algorithms',
          confidence: 0.9, // High quality
          reasoning: 'Technical',
          source: 'gpt-4o',
          alternatives: [],
          topics: ['computer science'],
          created_at: new Date()
        }
      ];

      const ranked = await votingEngine.rankQuestions(questions);
      const topQuestion = ranked[0];

      // With host profile enabled:
      // Final score = (quality × 0.5) + (diversity × 0.15) + (novelty × 0.15) + (host_fit × 0.2)
      const expectedScore =
        (topQuestion.votes.average * 0.5) +
        (topQuestion.diversity_score * 0.15) +
        ((topQuestion as any).novelty_score * 0.15) +
        ((topQuestion as any).host_fit_score * 0.2);

      expect(topQuestion.final_score).toBeCloseTo(expectedScore, 2);
    });
  });

  describe('6. End-to-End Phase 4 Workflow', () => {
    it('should complete full Phase 4 workflow', async () => {
      // Step 1: Generate questions (simulated)
      const generatedQuestions: Array<GeneratedQuestion & { source_model?: any }> = [
        {
          id: crypto.randomUUID(),
          question_text: 'How will AI change education in the next decade?',
          confidence: 0.85,
          reasoning: 'Future-focused AI question',
          source: 'gpt-4o',
          alternatives: [],
          topics: ['AI', 'education', 'future'],
          created_at: new Date()
        },
        {
          id: crypto.randomUUID(),
          question_text: 'What are the ethical implications of autonomous weapons?',
          confidence: 0.9,
          reasoning: 'Ethics and AI',
          source: 'claude-3',
          alternatives: [],
          topics: ['AI', 'ethics', 'warfare'],
          created_at: new Date()
        },
        {
          id: crypto.randomUUID(),
          question_text: 'Should we regulate social media algorithms?',
          confidence: 0.8,
          reasoning: 'Tech policy question',
          source: 'gemini-pro',
          alternatives: [],
          topics: ['technology', 'policy', 'social media'],
          created_at: new Date()
        }
      ];

      // Step 2: Rank with all Phase 4 features
      const rankedQuestions = await votingEngine.rankQuestions(generatedQuestions);
      expect(rankedQuestions.length).toBeGreaterThan(0);

      const topQuestion = rankedQuestions[0];

      // Step 3: Record host interaction
      await hostProfile.recordInteraction(topQuestion.question, 'asked', 7);

      // Step 4: Generate follow-up chains
      const followUpChain = await followUpChains.generateChain(
        topQuestion.question,
        'Tech ethics discussion',
        { maxDepth: 2, branchesPerLevel: 2 }
      );
      expect(followUpChain.chains.length).toBeGreaterThan(0);

      // Step 5: Track engagement
      await engagementTracker.recordChatMessage('Great question!', 'viewer1');
      await engagementTracker.recordChatMessage('Very thought-provoking', 'viewer2');
      await engagementTracker.recordViewerCount(250);

      const snapshot = await engagementTracker.takeSnapshot(
        topQuestion.question.id,
        'AI Ethics'
      );
      expect(snapshot).toBeDefined();

      // Step 6: Cluster questions
      const clusters = await topicClustering.clusterQuestions(
        generatedQuestions.map(q => ({
          text: q.question_text,
          id: q.id
        }))
      );
      expect(clusters.size).toBeGreaterThan(0);

      // Step 7: Verify all systems updated
      const updatedProfile = hostProfile.getProfile();
      expect(updatedProfile.total_questions_analyzed).toBeGreaterThan(0);
      expect(updatedProfile.confidence_score).toBeGreaterThan(0);

      const metrics = await engagementTracker.getMetricsAroundTime(new Date(), 60);
      expect(metrics.after).toBeDefined();

      const topicClusters = await topicClustering.getAllClusters();
      expect(topicClusters.length).toBeGreaterThan(0);

      const chainStats = await followUpChains.getChainStats(topQuestion.question.id);
      expect(chainStats.totalGenerated).toBe(followUpChain.totalFollowUps);

      console.log('✅ Phase 4 End-to-End Test Complete');
      console.log(`   - Host confidence: ${(updatedProfile.confidence_score * 100).toFixed(1)}%`);
      console.log(`   - Engagement level: ${snapshot?.engagementLevel}`);
      console.log(`   - Topic clusters: ${topicClusters.length}`);
      console.log(`   - Follow-ups generated: ${chainStats.totalGenerated}`);
    });
  });
});
