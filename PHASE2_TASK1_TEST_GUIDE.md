# Phase 2 Task 2.1 - Multi-Model Question Generation Test Guide

## 🎯 Overview

This guide explains how to test the Phase 2 multi-model question generation system, which uses GPT-4o, Claude Sonnet, and Gemini 2.0 Flash in parallel to generate and rank questions using semantic similarity and voting.

**Completion Date**: October 19, 2025
**Components**: MultiModelQuestionGenerator, SemanticSimilarity, VotingEngine, UI Display

---

## 📋 Prerequisites

### 1. Verify API Keys
All three AI provider keys must be configured in `.env`:

```bash
# Check keys are present (don't print them!)
grep -q "VITE_OPENAI_API_KEY=sk-" .env && echo "✅ OpenAI configured"
grep -q "VITE_ANTHROPIC_API_KEY=sk-ant-" .env && echo "✅ Anthropic configured"
grep -q "VITE_GEMINI_API_KEY=" .env && echo "✅ Gemini configured"
```

**Expected Output:**
```
✅ OpenAI configured
✅ Anthropic configured
✅ Gemini configured
```

### 2. Verify Dev Server Running
```bash
# Should show Vite dev server at http://localhost:5173/
pnpm run dev
```

---

## 🧪 Testing Phase 2 Multi-Model System

### Step 1: Enable Multi-Model Mode

The multi-model system is disabled by default for backward compatibility. You need to enable it via the Producer AI Panel:

1. **Open the application**: Navigate to `http://localhost:5173/`
2. **Find Producer AI Panel**: Located in the main control interface
3. **Open Settings**: Click the ⚙️ (Settings) icon in Producer AI Panel
4. **Enable Multi-Model**:
   - Toggle "Use Multi-Model" to ON
   - (Optional) Adjust individual model settings:
     - GPT-4o: Enabled by default
     - Claude: Enabled by default
     - Gemini: Enabled by default

Alternatively, enable via browser console:
```javascript
// Enable multi-model mode programmatically
const event = new CustomEvent('updateProducerConfig', {
  detail: { useMultiModel: true }
});
window.dispatchEvent(event);
```

### Step 2: Prepare Test Transcript

Use a sample philosophical discussion transcript (minimum 100 words). Here's a test example:

```javascript
const testTranscript = `
Host: Welcome back to Abe I Stream. Today we're discussing whether artificial intelligence can truly understand human emotions, or if it's just sophisticated pattern matching.

Guest 1: I think we need to distinguish between processing emotional data and actually feeling emotions. AI can recognize facial expressions and tone, but does it experience sadness?

Guest 2: That's the hard problem of consciousness right there. We can't even prove other humans experience emotions the way we do. It's all inference based on behavior.

Host: But isn't that exactly what humans do? We learn to recognize emotions through pattern matching too. A child learns what "happy" means by seeing examples.

Guest 1: The difference is qualitative experience - qualia. When I see red, there's a subjective experience of "redness" that goes beyond just processing wavelength data.

Guest 2: How do you know the AI doesn't have that? We're assuming it doesn't, but we have no way to measure subjective experience in anything other than ourselves.
`;
```

### Step 3: Trigger Manual Analysis

**Method A: Via UI (Recommended)**
1. In Producer AI Panel, click the **Play** (▶️) button
2. The system will:
   - Show "Analyzing..." status
   - Display real-time progress for each model
   - Show results when complete

**Method B: Via Browser Console**
```javascript
// Get the Producer AI hook instance
// (This assumes you've exposed the hook via React DevTools or a global)
producerAI.manualAnalyze();
```

**Method C: Via Transcript Insert** (Most Realistic)
1. Insert transcript into Supabase `live_transcript` table
2. Wait for automatic analysis (if Producer AI is enabled)

---

## 📊 Expected Results

### Phase 2 Multi-Model Generation Panel

After analysis completes, you should see a new **"Multi-Model Generation (Phase 2)"** panel with:

#### Model Status Grid (3 columns)
```
┌─────────────────┬─────────────────┬─────────────────┐
│   GPT-4o ✓      │   Claude ✓      │   Gemini ✓      │
├─────────────────┼─────────────────┼─────────────────┤
│ 3 questions     │ 4 questions     │ 3 questions     │
│ 2,453ms         │ 1,987ms         │ 1,654ms         │
│ $0.0023         │ $0.0018         │ $0.0001         │
└─────────────────┴─────────────────┴─────────────────┘

Total Time: 2,500ms  |  Total Cost: $0.0042
```

**What to Check:**
- ✅ All 3 models show green checkmarks (success)
- ✅ Question counts between 2-4 per model
- ✅ Timing under 3000ms per model
- ✅ Cost under $0.01 total
- ✅ If a model fails, red ❌ shows with error message

### Phase 2 Voted & Ranked Questions Panel

Below the model status, you should see **"Voted & Ranked Questions (Top 5)"** showing:

#### Question Card Example
```
┌────────────────────────────────────────────────────┐
│ #1 🥇  gpt-4o              Final Score: 87%        │
├────────────────────────────────────────────────────┤
│ "How would you design an experiment to test        │
│  whether an AI system experiences qualia, given    │
│  that we can't even prove it in other humans?"     │
├────────────────────────────────────────────────────┤
│ GPT-4o: 85%  │  Claude: 92%  │  Gemini: 84%      │
├────────────────────────────────────────────────────┤
│ Avg Quality: ████████░░ 89%                        │
│ Diversity:   ███████░░░ 72%                        │
└────────────────────────────────────────────────────┘
```

**What to Check:**
- ✅ Questions ranked #1-#5 with medal badges (🥇🥈🥉)
- ✅ Source model badge (green=GPT-4o, orange=Claude, blue=Gemini)
- ✅ Final score between 60-100%
- ✅ Individual voting scores from all 3 models
- ✅ Progress bars for quality and diversity
- ✅ Questions are NOT duplicates (deduplication working)

---

## 🔍 Testing Specific Features

### 1. Semantic Deduplication

**Test**: Generate questions on the same topic multiple times

**Expected**:
- Console logs show: `🔗 Deduped: "Question text..." (85% similar)`
- Similar questions are removed
- Only unique questions remain

**How to Verify**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for deduplication logs: `✅ After deduplication: X unique questions (removed Y)`

### 2. Cross-Model Voting

**Test**: Compare voting scores across models

**Expected**:
- Each question has 3 voting scores (GPT-4o, Claude, Gemini)
- Scores show variance (not all identical)
- Average score is weighted average of all 3

**How to Verify**:
- Check that voting scores differ slightly (e.g., 85%, 92%, 84%)
- Final score should be blend of all three

### 3. Diversity Scoring

**Test**: Questions should cover different angles

**Expected**:
- Top 5 questions explore different aspects
- Diversity scores between 60-95%
- Higher diversity = less word overlap with other questions

**How to Verify**:
- Read top 5 questions - should NOT be repetitive
- Check diversity progress bars - should show variation

### 4. Cost Tracking

**Test**: Monitor API costs

**Expected**:
- GPT-4o: ~$0.002-0.004 per analysis
- Claude: ~$0.001-0.003 per analysis
- Gemini: ~$0.0001-0.0003 per analysis (cheapest)
- Total: ~$0.003-0.008 per analysis

**How to Verify**:
- Check cost displayed in model status cards
- Total cost shown at bottom
- Should be under $0.01 for typical transcript

### 5. Error Handling

**Test**: Disable one API key to simulate failure

**Expected**:
- Failed model shows red ❌ icon
- Error message displayed
- Other models continue successfully
- Questions still generated from working models

**How to Test**:
1. Temporarily remove one API key from `.env`
2. Restart dev server: `pnpm run dev`
3. Trigger analysis
4. Verify UI shows error for that model
5. Restore API key and restart

---

## 📈 Performance Benchmarks

Based on typical ~500 word philosophical transcript:

| Metric | Target | Actual (Expected) |
|--------|--------|-------------------|
| **Total Execution Time** | < 4000ms | 2000-3000ms |
| **GPT-4o Time** | < 3000ms | 2000-2800ms |
| **Claude Time** | < 3000ms | 1500-2500ms |
| **Gemini Time** | < 3000ms | 1200-2200ms |
| **Total API Cost** | < $0.01 | $0.003-0.008 |
| **Questions Generated** | 6-12 total | 8-10 typical |
| **Questions After Dedup** | 4-8 unique | 5-7 typical |
| **Final Top Questions** | 5 | 5 (always) |
| **Deduplication Rate** | 10-30% | 20% typical |

### Parallel Execution Efficiency

The multi-model system runs all 3 AI providers **in parallel**, so total time should be:
- **Sequential**: 2000ms + 2000ms + 1500ms = 5500ms
- **Parallel**: max(2000ms, 2000ms, 1500ms) = ~2500ms
- **Speedup**: ~2.2x faster

---

## 🐛 Troubleshooting

### Issue: "Multi-Model Generation" panel doesn't appear

**Solution:**
1. Verify `useMultiModel` is enabled in config
2. Check browser console for errors
3. Ensure at least one model succeeded
4. Try manual analysis with console command

### Issue: All models show red ❌

**Solution:**
1. Check all API keys in `.env` file
2. Verify keys are valid (not expired)
3. Check API rate limits
4. Review browser console for specific error messages

### Issue: Questions are duplicates

**Solution:**
1. Check console for deduplication logs
2. Verify `similarity_threshold` in voting config (default 0.85)
3. Lower threshold for more aggressive dedup (0.75-0.80)

### Issue: Costs seem high

**Solution:**
1. Check transcript length (longer = higher cost)
2. Reduce `max_tokens` in model config
3. Disable expensive models (keep only Gemini for testing)

### Issue: One model always fails

**Solution:**
1. Verify specific API key for that provider
2. Check provider status page:
   - OpenAI: https://status.openai.com/
   - Anthropic: https://status.anthropic.com/
   - Google: https://status.cloud.google.com/
3. Review timeout settings (default 30s)

---

## ✅ Test Checklist

Use this checklist to verify all Phase 2 features:

### Infrastructure
- [ ] All 3 API keys configured
- [ ] Dev server running without errors
- [ ] MultiModelQuestionGenerator class loads
- [ ] VotingEngine class loads
- [ ] SemanticSimilarity module loads

### UI Display
- [ ] Multi-Model panel appears when enabled
- [ ] 3 model status cards display
- [ ] Success/failure icons show correctly
- [ ] Question counts displayed
- [ ] Timing displayed (ms)
- [ ] Costs displayed ($)
- [ ] Total stats row appears

### Voted Questions Panel
- [ ] Top 5 questions displayed
- [ ] Rank badges (#1-#5) show
- [ ] Medal colors correct (🥇🥈🥉)
- [ ] Source model badges colored correctly
- [ ] Final scores displayed
- [ ] Individual voting scores shown
- [ ] Quality progress bar renders
- [ ] Diversity progress bar renders
- [ ] Questions are unique (no duplicates)

### Functionality
- [ ] Parallel execution completes in <4s
- [ ] Deduplication works (console logs confirm)
- [ ] Questions ranked by final score
- [ ] Diversity scores vary
- [ ] Cost tracking accurate
- [ ] Error handling works (test by disabling one key)

### Performance
- [ ] Total time under 4000ms
- [ ] No memory leaks (check DevTools Performance)
- [ ] UI updates smoothly
- [ ] No console errors

---

## 📝 Next Steps After Testing

1. **Document Results**: Record actual performance metrics
2. **Create Phase 2 Completion Doc**: Similar to `PHASE1_TASK1_COMPLETE.md`
3. **Plan Phase 3**: Advanced Context Memory (if applicable)
4. **Production Readiness**:
   - Add rate limiting
   - Implement cost alerts
   - Add analytics tracking
   - Create admin dashboard for model performance

---

## 🔗 Related Files

- **Hook**: `/src/hooks/useProducerAI.ts`
- **Multi-Model Generator**: `/src/lib/ai/MultiModelQuestionGenerator.ts`
- **Voting Engine**: `/src/lib/ai/VotingEngine.ts`
- **Semantic Similarity**: `/src/lib/ai/SemanticSimilarity.ts`
- **UI Component**: `/src/components/ProducerAIPanel.tsx`
- **Types**: `/src/lib/ai/types.ts`

---

## 📞 Support

If you encounter issues during testing:

1. Check browser console for detailed error messages
2. Review API provider status pages
3. Verify environment variables loaded correctly
4. Check network tab for API request/response details
5. Review implementation guide: `PHASE2_IMPLEMENTATION_GUIDE.md`

---

**Last Updated**: October 19, 2025
**Status**: ✅ Ready for Testing
**Version**: Phase 2 Task 2.1 Complete
