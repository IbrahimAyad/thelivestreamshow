# AI Coordinator Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the AI Coordinator system. Follow the health check procedures first, then consult the issue-specific sections.

**Last Updated**: 2025-01-19 (Day 8)

---

## Quick Health Check

### 1. Check AI Coordinator Status

**Location**: ProducerAI Panel → AI Coordinator Monitor

**Healthy Indicators**:
- ✅ Event feed showing recent activity (< 30s ago)
- ✅ Total events > 0
- ✅ Event types > 3
- ✅ No errors in last 5 minutes

**Unhealthy Indicators**:
- ⚠️ No events in last 60 seconds
- ⚠️ Error count > 5
- ⚠️ Event feed empty

**Quick Fix**:
```typescript
// In browser console
window.location.reload()  // Refresh page to reinitialize
```

### 2. Check Database Connection

**Test Query** (via Supabase Dashboard or browser console):
```typescript
const { data, error } = await supabase
  .from('ai_coordinator_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)

console.log('Latest event:', data)
console.log('Error:', error)
```

**Expected**: Recent event within last 60 seconds
**Issue**: Error or no data → See [Database Connection Issues](#database-connection-issues)

### 3. Check BetaBot Mood

**Location**: BetaBot Director Panel

**Check**:
- Current mood displayed correctly
- Mood reason shown
- Last updated timestamp recent

**Test Mood Change**:
```typescript
// Should update instantly (< 1 second)
1. Change mood to "annoyed"
2. Verify UI updates immediately
3. Check blocking indicator appears
```

---

## Common Issues & Fixes

### Questions Not Generating

**Symptoms**:
- Click "Generate Questions" but nothing happens
- No new questions appear in queue
- No events in AI Coordinator Monitor

**Diagnostic Steps**:

1. **Check BetaBot Mood**
   ```
   Location: BetaBot Director Panel
   Look for: "annoyed" or "frustrated" mood
   ```

   **Fix**: Wait for blocking period to end OR set manual override:
   ```
   1. Go to BetaBot Director Panel
   2. Click "Manual Override"
   3. Select "Happy" mood
   4. Set duration: 1 minute
   5. Click "Apply Override"
   ```

2. **Check Console for Errors**
   ```javascript
   // Open browser console (F12)
   // Look for errors like:
   [ProducerAI] Error generating questions: ...
   [AICoordinator] Action blocked: ...
   ```

   **Common Error**: "Action blocked: betabot_mood_blocking"
   **Fix**: Change mood to "happy" or "neutral"

3. **Check Action Queue**
   ```typescript
   // In browser console
   const coordinator = window.__AI_COORDINATOR__  // If exposed
   console.log(coordinator?.getQueueStatus())
   ```

   **Expected Output**:
   ```json
   {
     "queueLength": 0-3,
     "processing": false,
     "blockedActions": []
   }
   ```

   **Issue**: queueLength > 10 → Queue jammed
   **Fix**: Refresh page to clear queue

### Duplicate Questions Keep Appearing

**Symptoms**:
- Same question suggested multiple times
- Similar questions not filtered
- Context memory not working

**Diagnostic Steps**:

1. **Check Context Memory Enabled**
   ```typescript
   // src/hooks/useAutomationEngine.ts line 54
   enableContextMemory: true  // ✅ Should be true
   ```

2. **Check Similarity Threshold**
   ```typescript
   // Threshold might be too high (>0.95 = only exact matches filtered)
   // Recommended: 0.85 (85% similar = duplicate)
   similarityThreshold: 0.85
   ```

3. **Check Rejected Questions Display**
   ```
   Location: ProducerAI Panel → Rejected Questions section
   Look for: Orange warning box with duplicate questions
   ```

   **Missing?** → Context memory not active
   **Present?** → Working correctly, just showing you what was filtered

4. **Check Console Logs**
   ```javascript
   // Look for:
   ❌ Question rejected: duplicate (similar question already exists)
   📊 Similarity score: 0.932 (threshold: 0.85)
   ```

**Fix Options**:

**Option 1**: Adjust similarity threshold (make stricter)
```typescript
similarityThreshold: 0.90  // More strict = fewer duplicates caught
```

**Option 2**: Clear context memory
```typescript
// In browser console
const memory = coordinator.getMemory()
await memory?.clearMemory()
console.log('Memory cleared ✅')
```

### Mood Changes Not Applying

**Symptoms**:
- Change mood but UI doesn't update
- Blocking doesn't take effect
- Mood reverts immediately

**Diagnostic Steps**:

1. **Check Real-time Subscription**
   ```javascript
   // Browser console
   // Look for:
   🔄 Real-time mood update received: { current_mood: 'annoyed', ... }
   ```

   **Missing?** → Subscription not working
   **Fix**: Refresh page to reinitialize subscription

2. **Check Database Update**
   ```sql
   -- In Supabase Dashboard → SQL Editor
   SELECT * FROM betabot_mood ORDER BY updated_at DESC LIMIT 1;
   ```

   **Expected**: recent updated_at timestamp
   **Issue**: Old timestamp → Database not updating

3. **Check Manual Override**
   ```typescript
   // If manual override is active, normal mood changes are ignored
   // Wait for override to expire OR clear it:
   const moodManager = coordinator.getMoodManager()
   moodManager.clearManualOverride()
   ```

**Fix**: Clear manual override and try again

### Predictive Scores Not Showing

**Symptoms**:
- Questions have no engagement scores
- Predictions show 0% or N/A
- Risk level always "medium"

**Diagnostic Steps**:

1. **Check Predictions Enabled**
   ```typescript
   // src/hooks/useAutomationEngine.ts line 52
   enablePredictions: true  // ✅ Should be true (Day 7+)
   ```

2. **Check Historical Data**
   ```sql
   -- Predictions require historical questions
   SELECT COUNT(*) FROM generated_questions WHERE created_at > NOW() - INTERVAL '30 days';
   ```

   **Expected**: At least 10 questions
   **Issue**: < 10 → Not enough data for predictions
   **Fix**: Continue using system, predictions improve over time

3. **Check Prediction Confidence**
   ```
   Low confidence (<60%) predictions are hidden by default
   Look in console for: Confidence: 45% (hidden from UI)
   ```

   **Fix**: Lower threshold temporarily:
   ```typescript
   confidenceThreshold: 0.3  // Show predictions with 30%+ confidence
   ```

---

## Debugging Blocked Actions

### Step-by-Step Debugging

**1. Identify the Blocked Action**

Check AI Coordinator Monitor for events:
```
Event: action_blocked
Data: { action_type: 'generate_questions', reason: 'betabot_mood_blocking' }
```

**2. Check Blocking Source**

| Reason | Source | Fix |
|--------|--------|-----|
| `betabot_mood_blocking` | Mood is "annoyed"/"frustrated" | Change mood or wait |
| `manual_override_active` | Manual override set | Wait for expiration |
| `rate_limit_exceeded` | Too many requests | Wait 1 minute |
| `validation_failed` | Invalid action data | Check action parameters |

**3. Verify Blocking Rules**

```typescript
// Mood blocking rules:
annoyed: blocks for 5 minutes
frustrated: blocks for 10 minutes

// Manual override: custom duration (1-60 minutes)
```

**4. Force Unblock (Emergency)**

```typescript
// Browser console
const moodManager = coordinator.getMoodManager()
moodManager.setMood('happy', 'Emergency unblock')
moodManager.clearManualOverride()

// Verify
console.log('Mood:', moodManager.getMood())
console.log('Blocked actions:', moodManager.getBlockedActions())
```

---

## Recovery Procedures

### Full System Reset

**When to Use**:
- System completely unresponsive
- Multiple components failing
- Database queries hanging

**Steps**:

1. **Save Current State** (if possible)
   ```typescript
   const questions = localStorage.getItem('producerAI_questions')
   console.log('Saved questions:', questions)
   ```

2. **Clear Local Storage**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   console.log('Storage cleared ✅')
   ```

3. **Reset Database State**
   ```sql
   -- Clear mood blocks
   UPDATE betabot_mood SET
     current_mood = 'neutral',
     manual_override_until = NULL,
     blocked_actions = '[]'
     WHERE id = (SELECT id FROM betabot_mood LIMIT 1);

   -- Verify
   SELECT * FROM betabot_mood;
   ```

4. **Refresh Application**
   ```typescript
   window.location.reload()
   ```

5. **Verify Health**
   - Check AI Coordinator Monitor shows events
   - Generate test question
   - Change mood and verify blocking works

### Coordinator Reinitialization

**When to Use**:
- Coordinator not responding
- Queue stuck
- Memory leaks suspected

**Steps**:

1. **Stop Current Coordinator**
   ```typescript
   // Browser console
   const coordinator = window.__AI_COORDINATOR__
   await coordinator?.shutdown()  // If method exists
   ```

2. **Reinitialize**
   ```typescript
   // Refresh page OR manually reinitialize
   window.location.reload()
   ```

3. **Verify Initialization**
   ```javascript
   // Look for in console:
   [useAutomationEngine] AICoordinator created
   [AICoordinator] Initialized for show: show-123
   ✅ AI Coordinator ready
   ```

### Database Connection Recovery

**When to Use**:
- Queries failing with connection errors
- Real-time updates stopped
- Supabase client errors

**Steps**:

1. **Test Connection**
   ```typescript
   const { data, error } = await supabase
     .from('ai_coordinator_logs')
     .select('count')

   if (error) {
     console.error('Connection failed:', error)
   } else {
     console.log('Connected ✅')
   }
   ```

2. **Check Environment Variables**
   ```bash
   # Verify .env or .env.local
   VITE_SUPABASE_URL=https://vcniezwtltraqramjlux.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...
   ```

3. **Recreate Supabase Client**
   ```typescript
   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```

4. **Verify Real-time**
   ```typescript
   const channel = supabase
     .channel('test')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'betabot_mood'
     }, (payload) => {
       console.log('✅ Real-time working:', payload)
     })
     .subscribe()

   // Wait 5 seconds, then test:
   // Update mood in BetaBot Director
   // Should see console log above
   ```

---

## Error Messages Reference

### Common Error Messages

| Error | Meaning | Fix |
|-------|---------|-----|
| `Action blocked: betabot_mood_blocking` | Mood prevents action | Change mood to happy/neutral |
| `Insufficient historical data` | Not enough questions for predictions | Continue using system |
| `Duplicate question detected` | Similar question already exists | Reword question or skip |
| `Database connection failed` | Supabase unreachable | Check network, verify env vars |
| `Embedding service unavailable` | OpenAI API down | Wait and retry |
| `Invalid action type` | Unknown action requested | Check action type spelling |
| `Queue depth exceeded` | Too many pending actions | Wait or refresh page |
| `Manual override expired` | Override duration ended | Set new override if needed |

### Error Code Reference

```typescript
// AICoordinator error codes
ERROR_MOOD_BLOCKING: 'E001'
ERROR_VALIDATION_FAILED: 'E002'
ERROR_QUEUE_FULL: 'E003'
ERROR_DATABASE_ERROR: 'E004'
ERROR_RATE_LIMIT: 'E005'

// ContextMemory error codes
ERROR_EMBEDDING_FAILED: 'M001'
ERROR_SIMILARITY_CHECK_FAILED: 'M002'

// PredictiveScoring error codes
ERROR_INSUFFICIENT_DATA: 'P001'
ERROR_PREDICTION_FAILED: 'P002'
```

---

## Performance Issues

### Slow Question Generation

**Symptoms**:
- Takes > 10 seconds to generate
- UI freezes during generation
- Browser becomes unresponsive

**Diagnostic Steps**:

1. **Check OpenAI API Latency**
   ```javascript
   // Look in console for:
   🧠 OpenAI request took: 8.2s
   ```

   **Normal**: 2-5 seconds
   **Slow**: > 8 seconds → OpenAI API slow
   **Fix**: Nothing to do, wait for API to recover

2. **Check Embedding Calls**
   ```javascript
   // Look for excessive embedding calls:
   📊 Generating embedding for: "question 1..."
   📊 Generating embedding for: "question 2..."
   ...  // Should be max 10-20 per generation
   ```

   **Issue**: > 50 embedding calls → Cache not working
   **Fix**: Check cache configuration

3. **Check Browser Resources**
   ```
   Chrome DevTools → Performance tab → Record
   Look for: Long tasks, memory leaks
   ```

   **Issue**: Memory > 500MB → Possible leak
   **Fix**: Refresh page to clear memory

### Database Query Performance

**Symptoms**:
- Queries taking > 5 seconds
- UI updates delayed
- Event logs slow to appear

**Diagnostic Steps**:

1. **Check Query Count**
   ```
   Chrome DevTools → Network tab → Filter: supabase
   Count requests in last minute
   ```

   **Normal**: < 20 requests/minute
   **High**: > 60 requests/minute → Possible polling still active

2. **Verify Real-time Enabled**
   ```javascript
   // Should see subscriptions, not polling:
   ✅ Real-time subscription active
   ❌ Polling every 1 second (outdated)
   ```

   **Fix**: Ensure Day 5 optimizations applied

---

## Monitoring Best Practices

### Daily Health Checks

**Morning Checklist** (before show):
- [ ] Open AI Coordinator Monitor
- [ ] Verify events in last hour
- [ ] Check error count = 0
- [ ] Test question generation
- [ ] Verify mood changes apply instantly

**During Show**:
- [ ] Monitor event feed for errors
- [ ] Watch for duplicate rejections (should be < 20%)
- [ ] Verify predictions showing (if enabled)
- [ ] Check queue depth < 5

**Post-Show**:
- [ ] Review prediction accuracy
- [ ] Check total questions generated
- [ ] Look for any errors to investigate

### Logging Configuration

**Production Logging Levels**:
```typescript
// Recommended settings:
coordinator: 'info'
contextMemory: 'warn'
predictiveScoring: 'info'
moodManager: 'info'
```

**Debug Mode** (for troubleshooting):
```typescript
// Enable verbose logging:
coordinator: 'debug'
contextMemory: 'debug'
predictiveScoring: 'debug'
moodManager: 'debug'
```

---

## Emergency Contacts

### Escalation Path

1. **Level 1**: Check this guide
2. **Level 2**: Review [Architecture Documentation](../architecture/AI_COORDINATION.md)
3. **Level 3**: Check system logs in Supabase Dashboard
4. **Level 4**: Contact engineering team

### Support Information

- **System Owner**: AI Coordinator Team
- **On-Call**: Check team schedule
- **Documentation**: `/docs` folder
- **Test Suite**: `pnpm test`

---

## Appendix: Diagnostic Queries

### Check Coordinator Health

```sql
-- Recent events (should be within last minute)
SELECT
  event_type,
  created_at,
  event_data
FROM ai_coordinator_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Check Mood History

```sql
-- Mood changes today
SELECT
  current_mood,
  reason,
  updated_at,
  manual_override_until
FROM betabot_mood_history  -- If history table exists
WHERE updated_at > CURRENT_DATE
ORDER BY updated_at DESC;
```

### Check Duplicate Detection Rate

```sql
-- Questions rejected as duplicates today
SELECT
  COUNT(*) FILTER (WHERE was_rejected = true) as rejected,
  COUNT(*) FILTER (WHERE was_rejected = false) as accepted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE was_rejected = true) / COUNT(*), 1) as rejection_rate_pct
FROM generated_questions
WHERE created_at > CURRENT_DATE;
```

### Check Prediction Accuracy

```sql
-- Average prediction accuracy
SELECT
  COUNT(*) as total_predictions,
  AVG(confidence_level) as avg_confidence,
  AVG(prediction_accuracy) FILTER (WHERE prediction_accuracy IS NOT NULL) as avg_accuracy,
  COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count
FROM predicted_outcomes
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

*This troubleshooting guide is part of the AI Coordinator system documentation. Last updated during Day 8 implementation.*
