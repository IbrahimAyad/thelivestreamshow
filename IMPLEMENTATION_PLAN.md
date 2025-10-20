# AI Coordination System - Implementation Plan

**Goal**: Get system production-ready in 2-3 weeks
**Strategy**: Small, testable increments. Each phase completable in one session.

---

## Phase 1: Critical Foundation (Week 1 - Days 1-3)

### Day 1: Testing Infrastructure ⚡ PRIORITY 1
**Time**: 4-6 hours | **Context**: Low (setup files only)

**Tasks**:
1. Install testing dependencies
   ```bash
   pnpm add -D vitest @vitest/ui @testing-library/react jsdom
   ```

2. Create `vitest.config.ts`
   ```typescript
   import { defineConfig } from 'vitest/config'
   export default defineConfig({
     test: {
       environment: 'jsdom',
       setupFiles: ['./src/test/setup.ts']
     }
   })
   ```

3. Create test structure
   ```
   src/lib/ai/__tests__/
   ├── AICoordinator.test.ts         (10 tests)
   ├── BetaBotMoodManager.test.ts    (8 tests)
   └── integration.test.ts           (5 tests)
   ```

4. Write 5 critical tests first:
   - AICoordinator.submitQuestion() approval
   - AICoordinator.submitQuestion() rejection
   - BetaBotMoodManager.setMood() with priority
   - BetaBotMoodManager manual override blocking
   - Integration: Producer AI → Coordinator → Database

**Success Criteria**: 5 tests passing, CI running

---

### Day 2: Error Monitoring ⚡ PRIORITY 2
**Time**: 3-4 hours | **Context**: Low (config only)

**Tasks**:
1. Add Sentry
   ```bash
   pnpm add @sentry/react @sentry/vite-plugin
   ```

2. Create `src/lib/monitoring/sentry.ts`
   ```typescript
   import * as Sentry from '@sentry/react'

   export function initMonitoring() {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
       tracesSampleRate: 0.1
     })
   }
   ```

3. Wrap critical functions with error tracking
   - AICoordinator.submitQuestion()
   - AICoordinator.executeProductionAction()
   - BetaBotMoodManager.setMood()

4. Add custom context to errors
   - Current show segment
   - Coordinator config state
   - Active mood override info

**Success Criteria**: Errors tracked in Sentry, alerts configured

---

### Day 3: Logging Cleanup ⚡ PRIORITY 3
**Time**: 4-5 hours | **Context**: Medium (touch many files)

**Tasks**:
1. Install logger
   ```bash
   pnpm add pino pino-pretty
   ```

2. Create `src/lib/logging/logger.ts`
   ```typescript
   import pino from 'pino'

   export const logger = pino({
     level: import.meta.env.PROD ? 'info' : 'debug',
     transport: !import.meta.env.PROD ? {
       target: 'pino-pretty'
     } : undefined
   })
   ```

3. Replace console.log in AI modules (focus on 5 key files):
   - AICoordinator.ts (35 logs)
   - BetaBotMoodManager.ts (24 logs)
   - AIContextAnalyzer.ts (12 logs)
   - PredictiveScoringEngine.ts (12 logs)
   - HostProfileManager.ts (12 logs)

4. Add log levels:
   - `logger.debug()` - verbose AI decisions
   - `logger.info()` - state changes
   - `logger.warn()` - blocked actions
   - `logger.error()` - failures

**Success Criteria**: Production logs readable, debug logs filtered out

---

## Phase 2: Enable Intelligence (Week 1-2 - Days 4-7)

### Day 4: Enable Context Memory 🧠
**Time**: 6-8 hours | **Context**: Medium

**Tasks**:
1. Update useAutomationEngine.ts
   ```typescript
   enableContextMemory: true  // Change from false
   ```

2. Test duplicate detection manually:
   - Generate question with Producer AI
   - Try to generate same question again
   - Verify it's flagged as duplicate

3. Add tests for Context Memory
   - Test isDuplicate() with similar questions
   - Test isDuplicate() with different questions
   - Test semantic similarity threshold

4. Add UI indicator for duplicates
   - Show "Similar question exists" warning
   - Display the existing similar question
   - Allow override if needed

**Success Criteria**: Duplicate detection working, 3 tests passing

---

### Day 5: Replace Polling with Real-time ⚡
**Time**: 4-5 hours | **Context**: Low (one component)

**Tasks**:
1. Update BetaBotDirectorPanel.tsx
   ```typescript
   // REMOVE: setInterval polling
   // ADD: Supabase subscription

   useEffect(() => {
     const subscription = supabase
       .channel('betabot_mood_changes')
       .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'betabot_mood'
       }, (payload) => {
         updateMoodState(payload.new)
         updateOverrideStatus(payload.new)
       })
       .subscribe()

     return () => subscription.unsubscribe()
   }, [])
   ```

2. Test real-time updates
   - Change mood from Director Panel → updates immediately
   - Change mood from another tab → updates in first tab
   - Verify no polling queries in network tab

**Success Criteria**: Zero polling, instant updates, 60 fewer DB queries/min

---

### Day 6: Simple Monitoring Dashboard 📊
**Time**: 6-8 hours | **Context**: Medium (new component)

**Tasks**:
1. Create `src/components/AICoordinatorMonitor.tsx`
   ```typescript
   // Real-time event feed (last 50 events)
   // Event type breakdown chart
   // Success/failure rate
   // Recent errors
   ```

2. Query ai_coordinator_logs efficiently
   - Use Supabase real-time for live feed
   - Aggregate by event_type for chart
   - Show last 10 errors with details

3. Add to main dashboard as collapsible panel

**Success Criteria**: Can see coordinator activity in real-time

---

### Day 7: Enable Predictive AI 🔮
**Time**: 6-8 hours | **Context**: High (complex feature)

**Tasks**:
1. Update useAutomationEngine.ts
   ```typescript
   enablePredictions: true  // Change from false
   ```

2. Test prediction flow manually:
   - Generate question → see predicted engagement score
   - Test with different question types
   - Verify high-scoring questions prioritized

3. Add tests for Predictive AI
   - Test score calculation
   - Test priority boost for high scores
   - Test learning from outcomes

4. Monitor prediction accuracy
   - Log predicted vs actual engagement
   - Calculate accuracy over time
   - Tune threshold if needed

**Success Criteria**: Questions ranked by predicted engagement, 4 tests passing

---

## Phase 3: Documentation & Polish (Week 2-3 - Days 8-10)

### Day 8: Architecture Documentation 📝
**Time**: 4-6 hours | **Context**: Low (docs only)

**Tasks**:
1. Create `docs/architecture/AI_COORDINATION.md`
   - System diagram (use mermaid)
   - Data flow diagrams
   - Component interaction
   - Priority hierarchy explanation

2. Create `docs/runbook/TROUBLESHOOTING.md`
   - Common issues and fixes
   - How to check coordinator health
   - How to debug blocked actions
   - How to recover from failures

3. Update JSDoc on public methods (top 10 most used)

**Success Criteria**: New developer can understand system in <1 hour

---

### Day 9: Enable Host Profile 👤
**Time**: 6-8 hours | **Context**: Medium

**Tasks**:
1. Update useAutomationEngine.ts
   ```typescript
   enableHostProfile: true  // Change from false
   ```

2. Test learning flow:
   - Use questions → mark as used
   - Reject questions → mark as rejected
   - Verify future suggestions adapt

3. Add UI to view host preferences
   - Favorite topics
   - Question usage stats
   - Rejection patterns

**Success Criteria**: System learns from host behavior, 3 tests passing

---

### Day 10: Production Hardening 🛡️
**Time**: 6-8 hours | **Context**: Low (config + fixes)

**Tasks**:
1. Add health check endpoint
   ```typescript
   // GET /api/health
   {
     coordinator: 'healthy',
     database: 'healthy',
     lastEvent: '2s ago',
     queueDepth: 3
   }
   ```

2. Add rate limiting
   - Max 10 questions/minute from Producer AI
   - Max 30 mood changes/hour
   - Max 100 log inserts/minute

3. Add data retention
   - Archive logs older than 30 days
   - Create cleanup cron job
   - Test archival process

4. Add .env.example with all required vars

**Success Criteria**: System handles edge cases, resource limits enforced

---

## Quick Reference Checklist

### Before Each Session
- [ ] Pull latest code
- [ ] Check remaining context (aim to keep >60k tokens free)
- [ ] Review previous session's work
- [ ] Run tests to verify nothing broke

### After Each Session
- [ ] Run full test suite
- [ ] Commit with descriptive message
- [ ] Update this plan with progress
- [ ] Document any blockers

### Context-Saving Tips
- Focus on ONE file at a time
- Avoid reading large files unnecessarily
- Use grep/glob instead of full file reads
- Commit frequently to save state

---

## Progress Tracking

| Phase | Task | Status | Time Spent | Blockers |
|-------|------|--------|------------|----------|
| 1.1 | Testing Infrastructure | ⬜ | - | - |
| 1.2 | Error Monitoring | ⬜ | - | - |
| 1.3 | Logging Cleanup | ⬜ | - | - |
| 2.1 | Enable Context Memory | ⬜ | - | - |
| 2.2 | Replace Polling | ⬜ | - | - |
| 2.3 | Monitoring Dashboard | ⬜ | - | - |
| 2.4 | Enable Predictive AI | ⬜ | - | - |
| 3.1 | Architecture Docs | ⬜ | - | - |
| 3.2 | Enable Host Profile | ⬜ | - | - |
| 3.3 | Production Hardening | ⬜ | - | - |

**Legend**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

---

## Emergency Context Recovery

If context runs out mid-session:

1. **Save state immediately**
   ```bash
   git add .
   git commit -m "WIP: [task name] - [what was done]"
   ```

2. **Create resume file**
   ```
   RESUME.md:
   - Last task: [X]
   - Completed: [list]
   - Next: [specific next action]
   - Files modified: [list]
   ```

3. **Start new session**
   - Read RESUME.md first
   - Continue from "Next" action
   - Don't re-read completed work

---

## Estimated Timeline

**Conservative**: 3 weeks (15 working days)
**Aggressive**: 2 weeks (10 working days)
**Realistic**: 2.5 weeks (12-13 working days)

**Critical Path**: Days 1-2-3 → Day 4 → Day 5 → Day 7 → Day 10

**Parallel Opportunities**:
- Days 6 & 8 can be done anytime
- Days 9 can be done after Day 7

**Risk Buffer**: 2-3 days for unexpected issues

---

## Success Metrics

**After Phase 1**:
- ✅ 15+ tests passing
- ✅ Errors tracked in Sentry
- ✅ Production logs clean

**After Phase 2**:
- ✅ Context Memory preventing duplicates
- ✅ Real-time updates (no polling)
- ✅ Predictive AI ranking questions
- ✅ Can see coordinator activity

**After Phase 3**:
- ✅ New developers onboarded in <1 hour
- ✅ System learns from host behavior
- ✅ Production-ready (health checks, rate limits)

**Production Ready Criteria**:
- [ ] 50+ tests passing
- [ ] Error monitoring active
- [ ] All 3 advanced features enabled and tested
- [ ] Documentation complete
- [ ] Health checks passing
- [ ] Rate limits configured
- [ ] Data retention implemented

---

**Plan Version**: 1.0
**Last Updated**: 2025-10-19
**Next Review**: After Phase 1 completion
