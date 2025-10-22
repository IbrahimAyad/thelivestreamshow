interface Voice {
  name: string;
  lang?: string;
  gender?: string;
  quality?: string;
}

interface VoiceSelectorProps {
  mode: 'browser' | 'piper';
  voices: Voice[];
  selectedVoice: Voice | null;
  isSpeaking: boolean;
  onVoiceChange: (voice: Voice) => void;
  onPreview: () => void;
}

export function VoiceSelector({
  mode,
  voices,
  selectedVoice,
  isSpeaking,
  onVoiceChange,
  onPreview
}: VoiceSelectorProps) {
  const isBrowser = mode === 'browser';

  return (
    <div className="voice-section">
      <div className="voice-header">
        <label htmlFor={`${mode}-voice-select`}>
          🎤 {isBrowser ? 'Voice Selection' : 'Piper Voice Selection'}
        </label>
        <button
          className="btn-preview"
          onClick={onPreview}
          disabled={!selectedVoice || isSpeaking}
        >
          ▶️ Preview
        </button>
      </div>
      <select
        id={`${mode}-voice-select`}
        value={selectedVoice?.name || ''}
        onChange={(e) => {
          const voice = voices.find(v => v.name === e.target.value);
          if (voice) onVoiceChange(voice);
        }}
        className="voice-select"
      >
        {voices.map((voice, index) => (
          <option key={`${voice.name}-${voice.lang || voice.gender}-${index}`} value={voice.name}>
            {isBrowser
              ? `${voice.name} (${voice.lang})`
              : `${voice.name} (${voice.gender}, ${voice.quality} quality)`
            }
          </option>
        ))}
      </select>
      <details className="voice-info-details">
        <summary className="voice-info-summary">💡 Voice Info</summary>
        <div className="voice-info-content">
          {isBrowser ? (
            <p>Using browser built-in voices. Choose voices starting with "Microsoft" or "Google" for best quality.</p>
          ) : (
            <p>Using Piper neural TTS. High quality voices sound better but may be slightly slower.</p>
          )}
        </div>
      </details>
    </div>
  );
}
