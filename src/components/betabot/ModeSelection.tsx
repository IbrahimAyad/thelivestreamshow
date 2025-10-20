interface ModeSelectionProps {
  betaBotMode: 'question-generator' | 'co-host';
  isListening: boolean;
  onModeChange: (mode: 'question-generator' | 'co-host') => void;
}

export function ModeSelection({
  betaBotMode,
  isListening,
  onModeChange
}: ModeSelectionProps) {
  const handleModeChange = (mode: 'question-generator' | 'co-host') => {
    if (isListening) {
      alert('Please stop the current session before switching modes');
      return;
    }
    onModeChange(mode);
  };

  return (
    <div className="mode-selection">
      <div className="mode-header">
        <label>Beta Bot Mode</label>
      </div>
      <div className="mode-buttons">
        <button
          className={`mode-btn ${betaBotMode === 'question-generator' ? 'active' : ''}`}
          onClick={() => handleModeChange('question-generator')}
          disabled={isListening}
        >
          <div className="mode-icon">📝</div>
          <div className="mode-content">
            <div className="mode-title">Question Generator</div>
            <div className="mode-description">Silent listening - Generates questions from conversation</div>
          </div>
        </button>
        <button
          className={`mode-btn ${betaBotMode === 'co-host' ? 'active' : ''}`}
          onClick={() => handleModeChange('co-host')}
          disabled={isListening}
        >
          <div className="mode-icon">🎙️</div>
          <div className="mode-content">
            <div className="mode-title">AI Co-Host</div>
            <div className="mode-description">Interactive - Responds to wake phrases & engages in conversation</div>
          </div>
        </button>
      </div>
    </div>
  );
}
