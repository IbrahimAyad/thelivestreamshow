interface TTSProviderSelectorProps {
  ttsProvider: 'browser' | 'f5tts';
  onProviderChange: (provider: 'browser' | 'f5tts') => void;
  f5TTSConnected: boolean;
  f5TTSError?: string;
  showFallbackWarning: boolean;
}

export function TTSProviderSelector({
  ttsProvider,
  onProviderChange,
  f5TTSConnected,
  f5TTSError,
  showFallbackWarning
}: TTSProviderSelectorProps) {
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as 'browser' | 'f5tts';
    onProviderChange(newProvider);
    localStorage.setItem('betabot_tts_provider', newProvider);
    console.log('TTS Provider changed to:', newProvider);
  };

  return (
    <div className="tts-provider-section">
      <div className="provider-header">
        <label htmlFor="tts-provider">TTS Engine</label>
      </div>
      <select
        id="tts-provider"
        value={ttsProvider}
        onChange={handleProviderChange}
        className="provider-select"
      >
        <option value="browser">Browser Voices (Built-in)</option>
        <option value="f5tts">F5-TTS (Local Server)</option>
      </select>

      {ttsProvider === 'f5tts' && (
        <div className="connection-status-box">
          <div className={`status-indicator ${f5TTSConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{f5TTSConnected ? 'Connected to F5-TTS Server' : 'Disconnected - Check server is running'}</span>
          </div>
          {f5TTSError && (
            <div className="error-message">
              Error: {f5TTSError}
            </div>
          )}
          {!f5TTSConnected && (
            <div className="server-info">
              Expected server: {import.meta.env.VITE_F5_TTS_API_URL || 'http://localhost:8000'}
            </div>
          )}
        </div>
      )}

      {showFallbackWarning && (
        <div className="fallback-warning">
          F5-TTS unavailable - using browser TTS as fallback
        </div>
      )}
    </div>
  );
}
