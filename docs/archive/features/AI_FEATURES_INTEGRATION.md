# AI Audio Capture & Question Generation Integration

## Overview

This document describes the new AI-powered features integrated into the Stream Enhancement Dashboard that enable proactive audio listening and automatic question generation from live stream content.

## Deployment Information

**Live Dashboard URL:** https://fjto4464sq8s.space.minimax.io

## New Features

### 1. AI Audio Capture Panel

A new component added to the "Discussion Show Production Tools" section that captures and transcribes audio in real-time.

**Location:** `/src/components/AudioCapturePanel.tsx`

**Features:**
- **Start/Stop Listening Button:** One-click control to begin or end audio capture
- **Real-time Status Indicator:** Visual feedback showing current state (Idle, Listening, Processing)
- **Latest Transcript Display:** Shows the most recent transcription (last 30 seconds)
- **Recent Transcripts List:** Displays a history of recent transcriptions with timestamps
- **Browser MediaRecorder API Integration:** Captures desktop audio or microphone input
- **Automatic Audio Processing:** Sends audio chunks to Supabase Edge Function every 5 seconds

**How It Works:**
1. User clicks "Start Listening" button
2. Browser requests microphone permission
3. MediaRecorder captures audio in 5-second chunks
4. Audio chunks are converted to base64 and sent to `audio-processor` edge function
5. Whisper API transcribes the audio
6. Transcripts are stored in `betabot_transcripts` table
7. Real-time updates appear in the UI via Supabase realtime subscriptions

**Technical Details:**
- Audio format: WebM
- Sample rate: 16kHz (optimized for speech)
- Processing interval: 5 seconds
- Features: Echo cancellation and noise suppression enabled

### 2. Auto-Generate from Stream Toggle

An enhancement to the existing ShowPrepPanel that enables automatic question generation from live transcripts.

**Location:** `/src/components/ShowPrepPanel.tsx`

**Features:**
- **Toggle Switch:** Enable/disable auto-generation with a visual toggle button
- **Visual Feedback:** Orange/red gradient styling when active
- **Real-time Processing:** Automatically generates questions as new transcripts arrive
- **Intelligent Filtering:** Only processes transcripts longer than 50 characters
- **Duplicate Prevention:** Tracks processed transcripts to avoid duplicates

**How It Works:**
1. User enables the "Auto-Generate from Stream" toggle
2. System subscribes to `betabot_transcripts` table changes
3. When new transcript is inserted:
   - Verifies it hasn't been processed before
   - Checks minimum length requirement (50 characters)
   - Calls `question-generator` edge function with transcript text
4. Generated questions are automatically inserted into `show_questions` table
5. Questions appear in TTS Queue Panel automatically
6. Questions can be refined using:
   - `duplicate-detector` (pgvector-based similarity checking)
   - `question-enhancer` (quality improvement)
   - `perplexity-search` (research context addition)

**Integration Flow:**
```
Audio Capture → Transcription → Auto-Generate Toggle (if enabled) → Question Generator → TTS Queue
```

## Database Schema

### betabot_sessions
```sql
CREATE TABLE betabot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### betabot_transcripts
```sql
CREATE TABLE betabot_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES betabot_sessions(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  confidence FLOAT,
  timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Supabase Edge Functions

The following edge functions are used by these features (already deployed):

### audio-processor
- **Purpose:** Transcribes audio using Whisper API
- **Input:** Base64-encoded audio data, session ID
- **Output:** Transcript text stored in database
- **Called by:** AudioCapturePanel every 5 seconds

### question-generator
- **Purpose:** Generates questions from transcripts
- **Input:** Transcript text, session ID
- **Output:** Array of generated questions
- **Called by:** ShowPrepPanel when auto-generate is enabled

### duplicate-detector
- **Purpose:** Checks for duplicate questions using pgvector
- **Called by:** question-generator internally

### question-enhancer
- **Purpose:** Improves question quality
- **Called by:** question-generator internally

### perplexity-search
- **Purpose:** Adds research context to questions
- **Called by:** question-generator internally

## Usage Guide

### Basic Workflow

1. **Start Audio Capture:**
   - Navigate to "Discussion Show Production Tools" section
   - Click "Start Listening" in the Audio Capture Panel
   - Grant microphone permissions when prompted
   - Status indicator will show "Listening..."

2. **Enable Auto-Generation:**
   - In the Show Prep Panel, toggle "Auto-Generate from Stream" to ON
   - The toggle will turn orange when active
   - Questions will now generate automatically from transcripts

3. **Monitor Transcripts:**
   - Watch real-time transcripts appear in the Audio Capture Panel
   - Recent transcripts are displayed with timestamps
   - Latest transcript shows the most recent 30 seconds

4. **Review Generated Questions:**
   - Auto-generated questions appear in the Show Prep Panel
   - Questions are tagged with topic "Auto-generated from stream"
   - Questions automatically flow to the TTS Queue Panel

5. **Generate TTS and Play:**
   - In the TTS Queue Panel, click "Generate Voice" for any question
   - Once generated, click "Play Live" to broadcast the question
   - Questions can be edited before generating TTS

### Advanced Features

**Manual Question Generation:**
- You can still manually enter topics and generate questions
- Both manual and auto-generated questions coexist in the same queue
- Manual questions are not tagged as "Auto-generated from stream"

**Session Management:**
- Each audio capture session is tracked in the database
- Sessions are automatically ended when "Stop Listening" is clicked
- Session information appears in the Audio Capture Panel header

**Editing and Cleanup:**
- Questions can be edited inline before TTS generation
- Individual questions can be deleted
- "Delete All" removes all questions from the queue

## Design Integration

### Visual Consistency

The new components maintain visual consistency with the existing dashboard:

- **Color Scheme:** Dark theme with red/orange/purple accents
- **Card Design:** Black background with gray borders
- **Typography:** Same font hierarchy and sizing
- **Icons:** Lucide React icons matching existing components
- **Buttons:** Consistent styling with hover states and transitions

### Layout Integration

**AudioCapturePanel Positioning:**
- Added to "Discussion Show Production Tools" section
- Placed in a grid layout alongside TTS Queue Panel
- Responsive design maintains layout on smaller screens

**ShowPrepPanel Enhancement:**
- Auto-generate toggle added at the top of the panel
- Visually distinct with gradient background
- Does not interfere with existing functionality
- Maintains all original features (manual topic input, question editing)

## Component Architecture

### AudioCapturePanel

**State Management:**
- `isListening`: Boolean indicating active audio capture
- `status`: Current status ('idle' | 'listening' | 'processing')
- `latestTranscript`: Most recent transcript text
- `currentSession`: Active session data
- `recentTranscripts`: Array of recent transcript objects

**Refs:**
- `mediaRecorderRef`: Reference to MediaRecorder instance
- `audioChunksRef`: Array of audio chunks being recorded
- `streamRef`: Reference to MediaStream for cleanup

**Real-time Subscriptions:**
- Subscribes to `betabot_transcripts` table for INSERT events
- Updates UI immediately when new transcripts arrive

### ShowPrepPanel (Enhanced)

**New State:**
- `autoGenerate`: Boolean toggle for auto-generation
- `lastProcessedTranscriptId`: Prevents duplicate processing

**New Methods:**
- `generateQuestionsFromTranscript()`: Calls question-generator edge function

**New Subscription:**
- Monitors `betabot_transcripts` when auto-generate is enabled
- Automatically processes new transcripts

## TypeScript Types

New interfaces added to `/src/lib/supabase.ts`:

```typescript
export interface BetaBotSession {
  id: string
  session_name: string
  started_at: string
  ended_at: string | null
  is_active: boolean
  created_at: string
}

export interface BetaBotTranscript {
  id: string
  session_id: string
  transcript_text: string
  confidence: number | null
  timestamp_seconds: number | null
  created_at: string
}
```

## Error Handling

### AudioCapturePanel
- Microphone permission errors show user-friendly alert
- Network errors during audio processing are logged
- Failed audio chunks don't interrupt the recording session

### ShowPrepPanel
- Failed question generation is logged but doesn't alert user
- Duplicate transcripts are silently filtered
- Short transcripts (< 50 chars) are ignored

## Performance Considerations

1. **Audio Processing:**
   - 5-second chunks balance responsiveness and API efficiency
   - Echo cancellation and noise suppression improve accuracy
   - 16kHz sample rate optimized for speech recognition

2. **Real-time Updates:**
   - Supabase realtime subscriptions provide instant UI updates
   - Minimal database queries reduce latency
   - Efficient state management prevents unnecessary re-renders

3. **Question Generation:**
   - Minimum character threshold prevents processing irrelevant snippets
   - Duplicate detection reduces API calls
   - Async processing doesn't block UI

## Future Enhancements

Potential improvements for future iterations:

1. **Transcript History:**
   - Add a modal to view full session transcript
   - Export transcripts to file
   - Search within transcripts

2. **Advanced Filtering:**
   - Configure minimum transcript length
   - Keyword filtering for question generation
   - Topic-based categorization

3. **Audio Quality Controls:**
   - Adjustable sample rate
   - Manual volume control
   - Audio source selection (desktop vs microphone)

4. **Question Customization:**
   - Configure question style/tone
   - Set number of questions to generate
   - AI model selection

5. **Analytics:**
   - Track question usage statistics
   - Measure transcript accuracy
   - Session performance metrics

## Troubleshooting

### Audio Capture Not Starting
- **Issue:** "Start Listening" button doesn't work
- **Solution:** Check browser microphone permissions in browser settings

### No Transcripts Appearing
- **Issue:** Audio is capturing but no transcripts show
- **Solution:** 
  - Check Supabase edge function logs
  - Verify `audio-processor` function is deployed
  - Ensure Whisper API credentials are configured

### Auto-Generate Not Working
- **Issue:** Toggle is enabled but no questions generated
- **Solution:**
  - Verify audio capture is active
  - Check transcript length (must be > 50 characters)
  - Review `question-generator` edge function logs

### Questions Not Appearing in TTS Queue
- **Issue:** Questions generated but don't show in queue
- **Solution:**
  - Check database connection
  - Verify `show_questions` table permissions
  - Refresh the page to reset realtime subscriptions

## Technical Dependencies

### Frontend
- React 18+
- TypeScript 5+
- Supabase JS Client
- Lucide React (icons)
- TailwindCSS (styling)

### Backend
- Supabase (database, realtime, edge functions)
- Whisper API (transcription)
- OpenAI API (question generation)
- pgvector (duplicate detection)

## Security Considerations

1. **Audio Privacy:**
   - Audio is processed in 5-second chunks and not stored permanently
   - Only transcripts are saved to database
   - Users must grant explicit permission for microphone access

2. **API Security:**
   - All edge function calls use Supabase authentication
   - API keys are stored securely in environment variables
   - Client-side code only has access to anon key

3. **Data Retention:**
   - Sessions are tracked for organization
   - Transcripts can be deleted via cascade when session is removed
   - Consider implementing retention policies for compliance

## Conclusion

The AI Audio Capture and Auto-Question Generation features seamlessly integrate into the existing Stream Enhancement Dashboard, providing powerful proactive capabilities while maintaining the clean, intuitive interface. The implementation follows React best practices, uses TypeScript for type safety, and leverages Supabase for real-time data synchronization.

---

**Last Updated:** October 16, 2025  
**Version:** 1.0  
**Dashboard URL:** https://fjto4464sq8s.space.minimax.io
