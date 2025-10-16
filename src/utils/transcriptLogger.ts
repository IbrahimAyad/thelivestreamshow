// Transcript logging utility for Beta Bot
import { supabase } from '../lib/supabase';

interface TranscriptEntry {
  text: string;
  timestamp: Date;
}

export class TranscriptLogger {
  private transcripts: TranscriptEntry[] = [];
  private sessionId: string | null = null;

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  async logTranscript(text: string): Promise<void> {
    if (!this.sessionId) return;

    const entry: TranscriptEntry = {
      text,
      timestamp: new Date()
    };

    this.transcripts.push(entry);

    // Save to database
    try {
      await supabase.from('betabot_conversation_log').insert({
        transcript_text: text,
        audio_timestamp: entry.timestamp.toISOString(),
        session_id: this.sessionId,
        speaker_type: 'host'
      });
    } catch (error) {
      console.error('Failed to save transcript to database:', error);
    }
  }

  getTranscripts(): TranscriptEntry[] {
    return this.transcripts;
  }

  getWordCount(): number {
    return this.transcripts.reduce((count, entry) => {
      return count + entry.text.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
  }

  clear(): void {
    this.transcripts = [];
    this.sessionId = null;
  }
}
