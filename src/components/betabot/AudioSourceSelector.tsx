interface AudioSourceSelectorProps {
  audioSource: 'browser' | 'obs';
  isListening: boolean;
  onSourceChange: (source: 'browser' | 'obs') => void;
}

export function AudioSourceSelector({
  audioSource,
  isListening,
  onSourceChange
}: AudioSourceSelectorProps) {
  return (
    <div className="audio-source-section">
      <div className="section-header">
        <label>🎤 Audio Input Source</label>
      </div>
      <div className="audio-source-buttons">
        <button
          className={`source-btn ${audioSource === 'browser' ? 'active' : ''}`}
          onClick={() => onSourceChange('browser')}
          disabled={isListening}
        >
          <div className="source-icon">🌐</div>
          <div className="source-content">
            <div className="source-title">Browser Microphone</div>
            <div className="source-description">Only captures host microphone</div>
          </div>
        </button>
        <button
          className={`source-btn ${audioSource === 'obs' ? 'active' : ''}`}
          onClick={() => onSourceChange('obs')}
          disabled={isListening}
        >
          <div className="source-icon">🎬</div>
          <div className="source-content">
            <div className="source-title">OBS Audio (RECOMMENDED)</div>
            <div className="source-description">Captures ALL audio - host + panel + stream (best for engagement!)</div>
          </div>
        </button>
      </div>
    </div>
  );
}
