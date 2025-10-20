/**
 * BetaBot Mood Manager Critical Tests
 *
 * Tests priority-based mood management:
 * 1. Context source can change mood when no override
 * 2. Context source is blocked when manual override is active
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BetaBotMoodManager, type Mood, type MoodSource } from '../BetaBotMoodManager';

// Test environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vcniezwtltraqramjlux.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ';

describe('BetaBotMoodManager: Critical Tests', () => {
  let moodManager: BetaBotMoodManager;
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  beforeEach(async () => {
    // Create fresh mood manager for each test
    moodManager = new BetaBotMoodManager();
    await moodManager.initialize();

    // Reset to default state
    await moodManager.setMood('neutral', 'default');

    // Clear any manual override
    moodManager.clearManualOverride();
  });

  describe('1. setMood() with Priority - Context Can Change Mood', () => {
    it('should allow context source to change mood when no override active', async () => {
      console.log('🧪 Testing: Context can change mood (no override)');

      // Step 1: Verify starting in neutral
      const initialState = await moodManager.getCurrentMood();
      expect(initialState.mood).toBe('neutral');
      console.log('   1️⃣ Initial mood: neutral');

      // Step 2: Context analyzer suggests amused mood
      const result = await moodManager.setMood('amused', 'context');

      // Step 3: Verify mood change was applied
      expect(result.status).toBe('applied');
      expect(result.reason).toBeUndefined();
      console.log('   2️⃣ Context mood applied successfully');

      // Step 4: Verify in database
      const newState = await moodManager.getCurrentMood();
      expect(newState.mood).toBe('amused');
      expect(newState.source).toBe('context');
      console.log('   3️⃣ Mood verified: amused (source: context)');

      // Step 5: Verify database was updated
      const { data } = await supabase
        .from('betabot_mood')
        .select('*')
        .limit(1)
        .single();

      expect(data?.mood).toBe('amused');

      console.log('✅ Context-driven mood change successful');
    });

    it('should apply moods from all sources when no override', async () => {
      console.log('🧪 Testing: All sources can change mood');

      // Test different sources (using only valid database moods)
      const sources: Array<{ mood: Mood; source: MoodSource }> = [
        { mood: 'bored', source: 'context' },
        { mood: 'amused', source: 'conversation' },
        { mood: 'spicy', source: 'context' }
      ];

      for (const { mood, source } of sources) {
        const result = await moodManager.setMood(mood, source);
        expect(result.status).toBe('applied');

        const state = await moodManager.getCurrentMood();
        expect(state.mood).toBe(mood);
        expect(state.source).toBe(source);

        console.log(`   ✅ ${source} → ${mood}: applied`);
      }

      console.log('✅ All sources can change mood when no override');
    });
  });

  describe('2. setMood() Manual Override Blocking', () => {
    it('should block context source when manual override is active', async () => {
      console.log('🧪 Testing: Manual override blocks context changes');

      // Step 1: Set manual override to 'bored' for 5 minutes
      const manualResult = await moodManager.setMood('bored', 'manual', 5);
      expect(manualResult.status).toBe('applied');
      console.log('   1️⃣ Manual override: bored (5 minutes)');

      // Step 2: Verify manual mood is active
      const manualState = await moodManager.getCurrentMood();
      expect(manualState.mood).toBe('bored');
      expect(manualState.source).toBe('manual');
      console.log('   2️⃣ Manual mood confirmed');

      // Step 3: Context analyzer tries to change mood to 'amused'
      const contextResult = await moodManager.setMood('amused', 'context');

      // Step 4: Verify context change was blocked
      expect(contextResult.status).toBe('blocked');
      expect(contextResult.reason).toBe('manual_override');
      expect(contextResult.blockedUntil).toBeDefined();
      console.log('   3️⃣ Context change blocked:', contextResult.reason);

      // Step 5: Verify mood is still 'bored' (manual)
      const currentState = await moodManager.getCurrentMood();
      expect(currentState.mood).toBe('bored');
      expect(currentState.source).toBe('manual');
      console.log('   4️⃣ Mood unchanged: bored (source: manual)');

      console.log('✅ Manual override successfully blocks context changes');

      // Cleanup
      moodManager.clearManualOverride();
    });

    it('should allow context changes after manual override expires', async () => {
      console.log('🧪 Testing: Context allowed after override expires');

      // Step 1: Set manual override for 0.05 minutes (3 seconds)
      await moodManager.setMood('spicy', 'manual', 0.05);
      console.log('   1️⃣ Manual override: spicy (3 seconds)');

      // Step 2: Verify context is blocked
      const blockedResult = await moodManager.setMood('amused', 'context');
      expect(blockedResult.status).toBe('blocked');
      console.log('   2️⃣ Context blocked during override');

      // Step 3: Wait for override to expire (4 seconds)
      console.log('   ⏳ Waiting for override to expire...');
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Step 4: Try context change again
      const allowedResult = await moodManager.setMood('amused', 'context');
      expect(allowedResult.status).toBe('applied');
      console.log('   3️⃣ Context change allowed after expiration');

      // Step 5: Verify mood changed
      const finalState = await moodManager.getCurrentMood();
      expect(finalState.mood).toBe('amused');
      expect(finalState.source).toBe('context');
      console.log('   4️⃣ Final mood: amused (source: context)');

      console.log('✅ Override expiration working correctly');
    });

    it('should respect priority hierarchy: manual > conversation > context', async () => {
      console.log('🧪 Testing: Priority hierarchy');

      // Priority 3 (lowest): Context
      await moodManager.setMood('neutral', 'context');
      let state = await moodManager.getCurrentMood();
      expect(state.source).toBe('context');
      console.log('   ✅ Priority 3: context applied');

      // Priority 2: Conversation (should override context)
      await moodManager.setConversationActive(true);
      await moodManager.setMood('amused', 'conversation');
      state = await moodManager.getCurrentMood();
      expect(state.source).toBe('conversation');
      console.log('   ✅ Priority 2: conversation overrides context');

      // Try context during conversation (should be blocked)
      const contextBlocked = await moodManager.setMood('bored', 'context');
      expect(contextBlocked.status).toBe('blocked');
      console.log('   ✅ Context blocked during conversation');

      // End conversation
      await moodManager.setConversationActive(false);

      // Priority 1 (highest): Manual (should override everything)
      await moodManager.setMood('spicy', 'manual', 1);
      state = await moodManager.getCurrentMood();
      expect(state.source).toBe('manual');
      console.log('   ✅ Priority 1: manual overrides conversation');

      // Try conversation during manual (should be blocked)
      await moodManager.setConversationActive(true);
      const conversationBlocked = await moodManager.setMood('amused', 'conversation');
      expect(conversationBlocked.status).toBe('blocked');
      console.log('   ✅ Conversation blocked during manual override');

      console.log('✅ Priority hierarchy working correctly');

      // Cleanup
      moodManager.clearManualOverride();
      await moodManager.setConversationActive(false);
    });
  });

  describe('3. Manual Override Duration', () => {
    it('should accept duration from 1-30 minutes', async () => {
      // Test minimum duration (1 minute)
      const result1 = await moodManager.setMood('spicy', 'manual', 1);
      expect(result1.status).toBe('applied');
      console.log('   ✅ 1 minute override accepted');

      moodManager.clearManualOverride();

      // Test maximum duration (30 minutes)
      const result30 = await moodManager.setMood('amused', 'manual', 30);
      expect(result30.status).toBe('applied');
      console.log('   ✅ 30 minute override accepted');

      moodManager.clearManualOverride();

      // Test default duration (5 minutes)
      const resultDefault = await moodManager.setMood('bored', 'manual');
      expect(resultDefault.status).toBe('applied');
      console.log('   ✅ Default (5 min) override accepted');

      console.log('✅ Override duration range working');

      // Cleanup
      moodManager.clearManualOverride();
      await moodManager.setMood('neutral', 'default');  // Reset to neutral
    });
  });
});
