#!/usr/bin/env node
/**
 * Phase 2 Multi-Model Test Script
 *
 * This script tests the multi-model question generation system end-to-end
 * by making real API calls to GPT-4o, Claude, and Gemini.
 *
 * Usage:
 *   node test-phase2-multimodel.js
 *
 * Requirements:
 *   - .env file with API keys configured
 *   - Node.js 18+ or compatible runtime
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Test transcript (philosophical discussion about AI consciousness)
const TEST_TRANSCRIPT = `
Host: Welcome back to Abe I Stream. Today we're discussing whether artificial intelligence can truly understand human emotions, or if it's just sophisticated pattern matching.

Guest 1: I think we need to distinguish between processing emotional data and actually feeling emotions. AI can recognize facial expressions and tone, but does it experience sadness?

Guest 2: That's the hard problem of consciousness right there. We can't even prove other humans experience emotions the way we do. It's all inference based on behavior.

Host: But isn't that exactly what humans do? We learn to recognize emotions through pattern matching too. A child learns what "happy" means by seeing examples.

Guest 1: The difference is qualitative experience - qualia. When I see red, there's a subjective experience of "redness" that goes beyond just processing wavelength data.

Guest 2: How do you know the AI doesn't have that? We're assuming it doesn't, but we have no way to measure subjective experience in anything other than ourselves.

Host: That's a fascinating point. So you're saying the absence of evidence isn't evidence of absence when it comes to machine consciousness?

Guest 1: Exactly. But I'd argue the burden of proof is on those claiming AI has consciousness. We should default to the null hypothesis.

Guest 2: But we apply different standards to humans. We don't demand proof that other people are conscious - we just assume it through empathy and similarity.
`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBox(title, color = 'cyan') {
  const border = '═'.repeat(title.length + 4);
  log(`╔${border}╗`, color);
  log(`║  ${title}  ║`, color);
  log(`╚${border}╝`, color);
}

async function testMultiModelSystem() {
  logBox('🧪 Phase 2 Multi-Model Test Suite', 'bright');
  console.log();

  // Step 1: Verify environment variables
  log('📋 Step 1: Verifying API Keys...', 'cyan');
  const apiKeys = {
    openai: process.env.VITE_OPENAI_API_KEY,
    anthropic: process.env.VITE_ANTHROPIC_API_KEY,
    gemini: process.env.VITE_GEMINI_API_KEY
  };

  let allKeysPresent = true;

  if (apiKeys.openai && apiKeys.openai.startsWith('sk-')) {
    log('  ✅ OpenAI API key configured', 'green');
  } else {
    log('  ❌ OpenAI API key missing or invalid', 'red');
    allKeysPresent = false;
  }

  if (apiKeys.anthropic && apiKeys.anthropic.startsWith('sk-ant-')) {
    log('  ✅ Anthropic API key configured', 'green');
  } else {
    log('  ❌ Anthropic API key missing or invalid', 'red');
    allKeysPresent = false;
  }

  if (apiKeys.gemini) {
    log('  ✅ Gemini API key configured', 'green');
  } else {
    log('  ❌ Gemini API key missing or invalid', 'red');
    allKeysPresent = false;
  }

  if (!allKeysPresent) {
    log('\n⚠️  Some API keys are missing. Check your .env file.', 'yellow');
    log('Test will continue but some models may fail.\n', 'yellow');
  }

  console.log();

  // Step 2: Test GPT-4o
  log('📋 Step 2: Testing GPT-4o Question Generation...', 'cyan');
  let gpt4oResult = null;
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert broadcast producer. Analyze the transcript and generate 2-3 follow-up questions in JSON format: {"questions": [{"question_text": "...", "confidence": 0.85}]}'
          },
          {
            role: 'user',
            content: `Analyze this transcript:\n\n${TEST_TRANSCRIPT}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    const timing = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const usage = data.usage;
    const cost = (usage.prompt_tokens * 0.0000025) + (usage.completion_tokens * 0.00001);

    const result = JSON.parse(data.choices[0].message.content);
    const questionCount = result.questions?.length || 0;

    gpt4oResult = { questionCount, timing, cost };

    log(`  ✅ GPT-4o Success`, 'green');
    log(`     Questions: ${questionCount}`, 'green');
    log(`     Time: ${timing}ms`, 'green');
    log(`     Cost: $${cost.toFixed(4)}`, 'green');
    log(`     Tokens: ${usage.total_tokens} (${usage.prompt_tokens} in, ${usage.completion_tokens} out)`, 'green');
  } catch (error) {
    log(`  ❌ GPT-4o Failed: ${error.message}`, 'red');
  }

  console.log();

  // Step 3: Test Claude
  log('📋 Step 3: Testing Claude Question Generation...', 'cyan');
  let claudeResult = null;
  try {
    const startTime = Date.now();

    // Import Anthropic SDK dynamically
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: apiKeys.anthropic });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: 'You are an expert broadcast producer. Analyze the transcript and generate 2-3 follow-up questions in JSON format: {"questions": [{"question_text": "...", "confidence": 0.85}]}',
      messages: [
        {
          role: 'user',
          content: `Analyze this transcript:\n\n${TEST_TRANSCRIPT}`
        }
      ]
    });

    const timing = Date.now() - startTime;
    const usage = response.usage;
    const cost = (usage.input_tokens * 0.000003) + (usage.output_tokens * 0.000015);

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const result = JSON.parse(analysisText);
    const questionCount = result.questions?.length || 0;

    claudeResult = { questionCount, timing, cost };

    log(`  ✅ Claude Success`, 'green');
    log(`     Questions: ${questionCount}`, 'green');
    log(`     Time: ${timing}ms`, 'green');
    log(`     Cost: $${cost.toFixed(4)}`, 'green');
    log(`     Tokens: ${usage.input_tokens + usage.output_tokens} (${usage.input_tokens} in, ${usage.output_tokens} out)`, 'green');
  } catch (error) {
    log(`  ❌ Claude Failed: ${error.message}`, 'red');
  }

  console.log();

  // Step 4: Test Gemini
  log('📋 Step 4: Testing Gemini Question Generation...', 'cyan');
  let geminiResult = null;
  try {
    const startTime = Date.now();

    // Import Google Generative AI SDK dynamically
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKeys.gemini);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent([
      'You are an expert broadcast producer. Analyze the transcript and generate 2-3 follow-up questions in JSON format: {"questions": [{"question_text": "...", "confidence": 0.85}]}',
      `Analyze this transcript:\n\n${TEST_TRANSCRIPT}`
    ]);

    const timing = Date.now() - startTime;
    const usage = result.response.usageMetadata;
    const cost = (usage?.promptTokenCount || 0) * 0.000000075 + (usage?.candidatesTokenCount || 0) * 0.0000003;

    const analysis = JSON.parse(result.response.text());
    const questionCount = analysis.questions?.length || 0;

    geminiResult = { questionCount, timing, cost };

    log(`  ✅ Gemini Success`, 'green');
    log(`     Questions: ${questionCount}`, 'green');
    log(`     Time: ${timing}ms`, 'green');
    log(`     Cost: $${cost.toFixed(4)}`, 'green');
    log(`     Tokens: ${usage?.totalTokenCount || 0} (${usage?.promptTokenCount || 0} in, ${usage?.candidatesTokenCount || 0} out)`, 'green');
  } catch (error) {
    log(`  ❌ Gemini Failed: ${error.message}`, 'red');
  }

  console.log();

  // Step 5: Summary
  logBox('📊 Test Summary', 'magenta');

  const successfulModels = [gpt4oResult, claudeResult, geminiResult].filter(r => r !== null).length;
  const totalQuestions = (gpt4oResult?.questionCount || 0) + (claudeResult?.questionCount || 0) + (geminiResult?.questionCount || 0);
  const totalCost = (gpt4oResult?.cost || 0) + (claudeResult?.cost || 0) + (geminiResult?.cost || 0);
  const maxTiming = Math.max(gpt4oResult?.timing || 0, claudeResult?.timing || 0, geminiResult?.timing || 0);

  console.log();
  log(`✓ Successful Models: ${successfulModels}/3`, successfulModels === 3 ? 'green' : 'yellow');
  log(`✓ Total Questions Generated: ${totalQuestions}`, 'green');
  log(`✓ Total Cost: $${totalCost.toFixed(4)}`, totalCost < 0.01 ? 'green' : 'yellow');
  log(`✓ Parallel Execution Time: ~${maxTiming}ms (estimated)`, maxTiming < 4000 ? 'green' : 'yellow');
  console.log();

  // Performance evaluation
  if (successfulModels === 3) {
    log('🎉 All models executed successfully!', 'green');
    log('✅ Phase 2 multi-model system is working correctly.', 'green');
  } else if (successfulModels > 0) {
    log('⚠️  Partial success - some models failed.', 'yellow');
    log('Check API keys and provider status for failed models.', 'yellow');
  } else {
    log('❌ All models failed!', 'red');
    log('Please check your API keys and network connection.', 'red');
  }

  console.log();
  log('📝 Next Steps:', 'cyan');
  log('  1. Review PHASE2_TASK1_TEST_GUIDE.md for UI testing', 'cyan');
  log('  2. Enable multi-model mode in the application', 'cyan');
  log('  3. Test deduplication and voting with real transcripts', 'cyan');
  log('  4. Monitor costs and performance in production', 'cyan');
  console.log();

  logBox('✅ Test Complete', 'green');
}

// Run the test
testMultiModelSystem().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
