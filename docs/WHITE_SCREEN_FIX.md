# White Screen Fix - OpenAI API Key Required

## ❌ Problem

After restart, got white screen with error:
```
Uncaught OpenAIError: Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
at TemplateGenerator.ts:10:16
```

## ✅ Solution

The `TemplateGenerator` was trying to initialize OpenAI client at module load time without checking if the API key exists.

### What I Fixed

**File**: [`src/lib/ai/TemplateGenerator.ts`](file:///Users/ibrahim/Desktop/thelivestreamshow/src/lib/ai/TemplateGenerator.ts)

**Before** (crashed if no API key):
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // ❌ Crashes if undefined
  dangerouslyAllowBrowser: true
})
```

**After** (lazy initialization):
```typescript
import OpenAI from 'openai'

// Lazy initialize OpenAI client only when needed
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local')
    }
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }
  return openaiClient
}
```

Now the OpenAI client is only created when you actually use the template generator, not on app startup.

## 🔑 Adding Your OpenAI API Key

### Step 1: Get Your API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)

### Step 2: Add to .env.local

Open [`.env.local`](file:///Users/ibrahim/Desktop/thelivestreamshow/.env.local) and replace:
```bash
VITE_OPENAI_API_KEY=your_openai_key_here
```

With:
```bash
VITE_OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### Step 3: Restart Dev Server

```bash
# Stop dev server (Ctrl+C)
# Restart:
npm run dev
```

## 🎯 What OpenAI Key Is Used For

The OpenAI API key enables these features:

### 1. ✅ Whisper Speech-to-Text (Most Important!)
- Transcribes your voice to text
- Powers the Audio Control Center
- **Required** for "production" keyword trigger to work
- Used by: `useSpeechRecognition.ts`

### 2. AI Template Generation
- Generate show templates automatically
- Used by: `TemplateGenerator.ts`
- **Optional** - you can use pre-built templates instead

### 3. AI Context Analysis
- Sentiment analysis
- Engagement scoring
- Used by: `AIContextAnalyzer.ts`
- **Optional** - can be disabled

## 🔧 If You Don't Have an OpenAI Key Yet

**The app will now load successfully** even without the key! The fix I made ensures:

1. ✅ App loads normally
2. ✅ All non-AI features work
3. ✅ Error only shows when you try to use AI features
4. ✅ Clear error message tells you what's missing

**What won't work without the key:**
- ❌ Whisper transcription (Audio Control Center → Whisper mode)
- ❌ AI template generation
- ❌ Some AI analysis features

**What will still work:**
- ✅ Browser Web Speech API (Chrome's built-in transcription)
- ✅ Manual template creation
- ✅ All other dashboard features
- ✅ OBS connection
- ✅ TTS (BetaBot speaking)
- ✅ Preset templates (tech-talk, interview, etc.)

## 🧪 Testing After Fix

### Test 1: App Loads
1. Reload the page
2. Should see dashboard (no white screen!)
3. Console may show warning about missing API key, but app works

### Test 2: Use Transcription Panel Instead
If you don't have OpenAI key yet, use the **Transcription Panel**:
1. Scroll to **"Live Transcription"** panel
2. Click **"Start Listening"**
3. This uses Chrome's built-in speech recognition (FREE!)
4. Say "production" - should still trigger the graphic!

### Test 3: Audio Control Center (Browser Mode)
1. Don't select Whisper mode
2. Use browser-based transcription
3. Works without OpenAI key

## 📝 Summary

### What Was Fixed:
1. ✅ Changed OpenAI initialization from eager to lazy
2. ✅ App no longer crashes if API key missing
3. ✅ Updated `.env.local` with clear instructions
4. ✅ You can now use the app without OpenAI key (with limitations)

### What You Need to Do:
1. **Option A**: Add OpenAI API key to `.env.local` for full features
2. **Option B**: Use app without key, use browser transcription instead

### For Full Production Alert Testing:
- **With OpenAI key**: Use Audio Control Center (Whisper mode)
- **Without OpenAI key**: Use Transcription Panel (browser mode)

Both will trigger the production alert when you say "production"!

---

**The app should now load successfully. Add your OpenAI key when you get one, or use browser transcription in the meantime!** 🎉
