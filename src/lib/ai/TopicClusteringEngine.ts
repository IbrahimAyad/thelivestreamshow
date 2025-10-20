/**
 * TopicClusteringEngine - Phase 4: Intelligent Question Evolution
 *
 * Groups questions into semantic topic clusters to understand relationships
 * and navigate between related topics intelligently.
 *
 * Key Features:
 * - K-means clustering of question embeddings
 * - Topic cluster identification and naming
 * - Related cluster discovery
 * - Topic transition recommendations
 * - Cluster statistics and analytics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  TopicCluster,
  TopicClusteringConfig,
  DEFAULT_TOPIC_CLUSTERING_CONFIG
} from './types';
import { getBatchEmbeddings, cosineSimilarity } from './SemanticSimilarity';

interface ClusterCandidate {
  questionText: string;
  embedding: number[];
  questionId: string;
}

export class TopicClusteringEngine {
  private supabase: SupabaseClient;
  private config: TopicClusteringConfig;
  private clusters: Map<string, TopicCluster> = new Map();
  private lastClusteringTime: Date = new Date(0);
  private reclusterTimer: NodeJS.Timeout | null = null;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: TopicClusteringConfig = DEFAULT_TOPIC_CLUSTERING_CONFIG
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = config;
  }

  /**
   * Initialize and load existing clusters from database
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[TopicClustering] Disabled by config');
      return;
    }

    // Load existing clusters
    const { data: existingClusters } = await this.supabase
      .from('topic_clusters')
      .select('*')
      .order('question_count', { ascending: false })
      .limit(this.config.maxClusters);

    if (existingClusters && existingClusters.length > 0) {
      existingClusters.forEach(cluster => {
        this.clusters.set(cluster.id, this.dbToCluster(cluster));
      });
      console.log(`[TopicClustering] Loaded ${this.clusters.size} clusters`);
    }

    // Start periodic re-clustering if enabled
    if (this.config.reclusleringInterval > 0) {
      this.startPeriodicReclustering();
    }
  }

  /**
   * Cluster a batch of questions
   */
  async clusterQuestions(
    questions: Array<{ text: string; id: string; embedding?: number[] }>
  ): Promise<Map<string, string[]>> {
    if (questions.length < this.config.minQuestionsPerCluster) {
      console.log(`[TopicClustering] Not enough questions (${questions.length} < ${this.config.minQuestionsPerCluster})`);
      return new Map();
    }

    // Get embeddings for questions that don't have them
    const questionsNeedingEmbeddings = questions.filter(q => !q.embedding);
    const newEmbeddings = questionsNeedingEmbeddings.length > 0
      ? await getBatchEmbeddings(questionsNeedingEmbeddings.map(q => q.text))
      : [];

    // Combine questions with embeddings
    const candidates: ClusterCandidate[] = questions.map((q, i) => ({
      questionText: q.text,
      embedding: q.embedding || newEmbeddings[questionsNeedingEmbeddings.indexOf(q)] || [],
      questionId: q.id
    }));

    // Perform clustering based on algorithm
    let clusterAssignments: Map<string, string[]>;

    switch (this.config.clusteringAlgorithm) {
      case 'kmeans':
        clusterAssignments = this.kMeansClustering(candidates);
        break;
      case 'dbscan':
        clusterAssignments = this.dbscanClustering(candidates);
        break;
      case 'hierarchical':
        clusterAssignments = this.hierarchicalClustering(candidates);
        break;
      default:
        clusterAssignments = this.kMeansClustering(candidates);
    }

    // Update cluster metadata
    await this.updateClusterMetadata(clusterAssignments, candidates);

    return clusterAssignments;
  }

  /**
   * Find the best matching cluster for a question
   */
  async findClusterForQuestion(questionText: string, questionEmbedding?: number[]): Promise<TopicCluster | null> {
    if (this.clusters.size === 0) {
      return null;
    }

    // Get embedding if not provided
    const embedding = questionEmbedding || (await getBatchEmbeddings([questionText]))[0];

    let bestCluster: TopicCluster | null = null;
    let bestSimilarity = 0;

    // Find most similar cluster
    for (const cluster of this.clusters.values()) {
      const similarity = cosineSimilarity(embedding, cluster.centroidEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    // Only return if similarity is above threshold
    return bestSimilarity > 0.6 ? bestCluster : null;
  }

  /**
   * Get recommended next topics based on current cluster
   */
  async getTopicRecommendations(currentClusterId: string, maxResults: number = 5): Promise<TopicCluster[]> {
    const currentCluster = this.clusters.get(currentClusterId);
    if (!currentCluster) {
      return [];
    }

    // Sort related clusters by combination of similarity and transition count
    const recommendations = currentCluster.relatedClusters
      .map(rel => {
        const cluster = this.clusters.get(rel.clusterId);
        if (!cluster) return null;

        // Score = (similarity × 0.6) + (normalized transition count × 0.4)
        const maxTransitions = Math.max(...currentCluster.relatedClusters.map(r => r.transitionCount));
        const normalizedTransitions = maxTransitions > 0 ? rel.transitionCount / maxTransitions : 0;
        const score = (rel.similarity * 0.6) + (normalizedTransitions * 0.4);

        return { cluster, score };
      })
      .filter((item): item is { cluster: TopicCluster; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.cluster);

    return recommendations;
  }

  /**
   * Get cluster statistics
   */
  getClusterStats(): {
    totalClusters: number;
    avgQuestionsPerCluster: number;
    topClusters: Array<{ name: string; questionCount: number }>;
  } {
    const clusters = Array.from(this.clusters.values());

    return {
      totalClusters: clusters.length,
      avgQuestionsPerCluster: clusters.length > 0
        ? clusters.reduce((sum, c) => sum + c.questionCount, 0) / clusters.length
        : 0,
      topClusters: clusters
        .sort((a, b) => b.questionCount - a.questionCount)
        .slice(0, 5)
        .map(c => ({ name: c.name, questionCount: c.questionCount }))
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.reclusterTimer) {
      clearInterval(this.reclusterTimer);
      this.reclusterTimer = null;
    }
  }

  // ============================================================================
  // Private Clustering Algorithms
  // ============================================================================

  /**
   * K-means clustering algorithm
   */
  private kMeansClustering(candidates: ClusterCandidate[]): Map<string, string[]> {
    const k = Math.min(this.config.maxClusters, Math.floor(candidates.length / this.config.minQuestionsPerCluster));

    if (k < 2) {
      // Not enough data for clustering, put everything in one cluster
      const clusterId = crypto.randomUUID();
      return new Map([[clusterId, candidates.map(c => c.questionId)]]);
    }

    // Initialize centroids randomly
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < k; i++) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * candidates.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      centroids.push([...candidates[randomIndex].embedding]);
    }

    // Run k-means iterations
    const maxIterations = 20;
    let assignments: number[] = new Array(candidates.length).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign each point to nearest centroid
      const newAssignments = candidates.map((candidate, i) => {
        let minDistance = Infinity;
        let bestCluster = 0;

        centroids.forEach((centroid, clusterIdx) => {
          const similarity = cosineSimilarity(candidate.embedding, centroid);
          const distance = 1 - similarity; // Convert similarity to distance

          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = clusterIdx;
          }
        });

        return bestCluster;
      });

      // Check for convergence
      if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
        break;
      }

      assignments = newAssignments;

      // Update centroids
      for (let clusterIdx = 0; clusterIdx < k; clusterIdx++) {
        const clusterPoints = candidates.filter((_, i) => assignments[i] === clusterIdx);

        if (clusterPoints.length > 0) {
          // Average all embeddings in this cluster
          const newCentroid = new Array(clusterPoints[0].embedding.length).fill(0);

          clusterPoints.forEach(point => {
            point.embedding.forEach((val, dim) => {
              newCentroid[dim] += val;
            });
          });

          newCentroid.forEach((val, dim) => {
            newCentroid[dim] = val / clusterPoints.length;
          });

          centroids[clusterIdx] = newCentroid;
        }
      }
    }

    // Convert to Map<clusterId, questionIds[]>
    const clusterMap = new Map<string, string[]>();

    for (let clusterIdx = 0; clusterIdx < k; clusterIdx++) {
      const questionIds = candidates
        .filter((_, i) => assignments[i] === clusterIdx)
        .map(c => c.questionId);

      if (questionIds.length >= this.config.minQuestionsPerCluster) {
        const clusterId = crypto.randomUUID();
        clusterMap.set(clusterId, questionIds);
      }
    }

    console.log(`[TopicClustering] K-means created ${clusterMap.size} clusters from ${candidates.length} questions`);

    return clusterMap;
  }

  /**
   * DBSCAN clustering algorithm (density-based)
   */
  private dbscanClustering(candidates: ClusterCandidate[]): Map<string, string[]> {
    const eps = 0.3; // Maximum distance for neighbors (1 - similarity)
    const minPts = this.config.minQuestionsPerCluster;

    const visited = new Set<number>();
    const clusters: number[][] = [];

    for (let i = 0; i < candidates.length; i++) {
      if (visited.has(i)) continue;

      visited.add(i);

      // Find neighbors
      const neighbors = this.findNeighbors(candidates, i, eps);

      if (neighbors.length < minPts) {
        // Noise point, skip
        continue;
      }

      // Start new cluster
      const cluster: number[] = [i];
      const queue = [...neighbors];

      while (queue.length > 0) {
        const pointIdx = queue.shift()!;

        if (visited.has(pointIdx)) continue;
        visited.add(pointIdx);

        cluster.push(pointIdx);

        const pointNeighbors = this.findNeighbors(candidates, pointIdx, eps);
        if (pointNeighbors.length >= minPts) {
          queue.push(...pointNeighbors);
        }
      }

      clusters.push(cluster);
    }

    // Convert to Map
    const clusterMap = new Map<string, string[]>();
    clusters.forEach(cluster => {
      if (cluster.length >= minPts) {
        const clusterId = crypto.randomUUID();
        clusterMap.set(clusterId, cluster.map(idx => candidates[idx].questionId));
      }
    });

    console.log(`[TopicClustering] DBSCAN created ${clusterMap.size} clusters from ${candidates.length} questions`);

    return clusterMap;
  }

  /**
   * Hierarchical clustering (agglomerative)
   */
  private hierarchicalClustering(candidates: ClusterCandidate[]): Map<string, string[]> {
    // Start with each question as its own cluster
    const clusters: number[][] = candidates.map((_, i) => [i]);

    // Merge until we have desired number of clusters
    const targetClusters = Math.min(
      this.config.maxClusters,
      Math.floor(candidates.length / this.config.minQuestionsPerCluster)
    );

    while (clusters.length > targetClusters && clusters.length > 1) {
      let minDistance = Infinity;
      let mergeI = 0;
      let mergeJ = 1;

      // Find closest pair of clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.clusterDistance(clusters[i], clusters[j], candidates);
          if (distance < minDistance) {
            minDistance = distance;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge the two closest clusters
      clusters[mergeI] = [...clusters[mergeI], ...clusters[mergeJ]];
      clusters.splice(mergeJ, 1);
    }

    // Convert to Map
    const clusterMap = new Map<string, string[]>();
    clusters.forEach(cluster => {
      if (cluster.length >= this.config.minQuestionsPerCluster) {
        const clusterId = crypto.randomUUID();
        clusterMap.set(clusterId, cluster.map(idx => candidates[idx].questionId));
      }
    });

    console.log(`[TopicClustering] Hierarchical created ${clusterMap.size} clusters from ${candidates.length} questions`);

    return clusterMap;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private findNeighbors(candidates: ClusterCandidate[], pointIdx: number, eps: number): number[] {
    const neighbors: number[] = [];
    const point = candidates[pointIdx];

    candidates.forEach((candidate, i) => {
      if (i === pointIdx) return;

      const similarity = cosineSimilarity(point.embedding, candidate.embedding);
      const distance = 1 - similarity;

      if (distance <= eps) {
        neighbors.push(i);
      }
    });

    return neighbors;
  }

  private clusterDistance(cluster1: number[], cluster2: number[], candidates: ClusterCandidate[]): number {
    // Average linkage: average distance between all pairs
    let totalDistance = 0;
    let count = 0;

    cluster1.forEach(i => {
      cluster2.forEach(j => {
        const similarity = cosineSimilarity(
          candidates[i].embedding,
          candidates[j].embedding
        );
        totalDistance += (1 - similarity);
        count++;
      });
    });

    return count > 0 ? totalDistance / count : Infinity;
  }

  private async updateClusterMetadata(
    clusterAssignments: Map<string, string[]>,
    candidates: ClusterCandidate[]
  ): Promise<void> {
    const newClusters = new Map<string, TopicCluster>();

    for (const [clusterId, questionIds] of clusterAssignments.entries()) {
      const clusterCandidates = candidates.filter(c => questionIds.includes(c.questionId));

      // Calculate centroid
      const centroid = this.calculateCentroid(clusterCandidates.map(c => c.embedding));

      // Extract keywords from questions
      const keywords = this.extractKeywords(clusterCandidates.map(c => c.questionText));

      // Generate cluster name from top keywords
      const name = keywords.slice(0, 3).join(', ');

      const cluster: TopicCluster = {
        id: clusterId,
        name,
        keywords,
        centroidEmbedding: centroid,
        questionCount: questionIds.length,
        relatedClusters: [],
        firstSeen: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      newClusters.set(clusterId, cluster);
    }

    // Find related clusters
    for (const [clusterId, cluster] of newClusters.entries()) {
      const related = Array.from(newClusters.entries())
        .filter(([otherId]) => otherId !== clusterId)
        .map(([otherId, otherCluster]) => ({
          clusterId: otherId,
          similarity: cosineSimilarity(cluster.centroidEmbedding, otherCluster.centroidEmbedding),
          transitionCount: 0
        }))
        .filter(rel => rel.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      cluster.relatedClusters = related;
    }

    // Save to database
    for (const cluster of newClusters.values()) {
      await this.saveCluster(cluster);
    }

    this.clusters = newClusters;
    this.lastClusteringTime = new Date();
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    embeddings.forEach(embedding => {
      embedding.forEach((val, dim) => {
        centroid[dim] += val;
      });
    });

    return centroid.map(val => val / embeddings.length);
  }

  private extractKeywords(questions: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set(['what', 'how', 'why', 'when', 'where', 'who', 'which', 'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'you', 'your', 'this', 'that', 'these', 'those', 'can', 'could', 'would', 'should']);

    questions.forEach(q => {
      const words = q.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async saveCluster(cluster: TopicCluster): Promise<void> {
    const { error } = await this.supabase
      .from('topic_clusters')
      .upsert([{
        id: cluster.id,
        name: cluster.name,
        keywords: cluster.keywords,
        centroid_embedding: cluster.centroidEmbedding,
        question_count: cluster.questionCount,
        avg_engagement: cluster.avgEngagement,
        related_clusters: cluster.relatedClusters,
        first_seen: cluster.firstSeen.toISOString(),
        last_seen: cluster.lastSeen.toISOString(),
        created_at: cluster.createdAt.toISOString(),
        updated_at: cluster.updatedAt.toISOString()
      }]);

    if (error) {
      console.error('[TopicClustering] Error saving cluster:', error);
    }
  }

  private dbToCluster(dbCluster: any): TopicCluster {
    return {
      id: dbCluster.id,
      name: dbCluster.name,
      keywords: dbCluster.keywords || [],
      centroidEmbedding: dbCluster.centroid_embedding || [],
      questionCount: dbCluster.question_count || 0,
      avgEngagement: dbCluster.avg_engagement,
      avgSuccessRate: dbCluster.avg_success_rate,
      relatedClusters: dbCluster.related_clusters || [],
      firstSeen: new Date(dbCluster.first_seen),
      lastSeen: new Date(dbCluster.last_seen),
      createdAt: new Date(dbCluster.created_at),
      updatedAt: new Date(dbCluster.updated_at)
    };
  }

  private startPeriodicReclustering(): void {
    if (this.reclusterTimer) {
      clearInterval(this.reclusterTimer);
    }

    this.reclusterTimer = setInterval(async () => {
      console.log('[TopicClustering] Running periodic re-clustering...');
      // Re-clustering logic would go here
      // For now, just log
    }, this.config.reclusleringInterval);
  }
}
