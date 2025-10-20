interface OBSConnectionPanelProps {
  obsConnected: boolean;
  obsError?: string;
  obsHost: string;
  obsPort: number;
  obsPassword: string;
  obsAudioPort: number;
  obsAudioSources: string[];
  selectedSource: string | null;
  onHostChange: (host: string) => void;
  onPortChange: (port: number) => void;
  onPasswordChange: (password: string) => void;
  onAudioPortChange: (port: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSourceSelect: (sourceName: string, audioPort: number) => void;
}

export function OBSConnectionPanel({
  obsConnected,
  obsError,
  obsHost,
  obsPort,
  obsPassword,
  obsAudioPort,
  obsAudioSources,
  selectedSource,
  onHostChange,
  onPortChange,
  onPasswordChange,
  onAudioPortChange,
  onConnect,
  onDisconnect,
  onSourceSelect
}: OBSConnectionPanelProps) {
  return (
    <div className="obs-settings-section">
      <h4>🎬 OBS WebSocket Connection</h4>

      <div className="obs-connection-status">
        <div className={`status-indicator ${obsConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span>{obsConnected ? 'Connected to OBS' : 'Disconnected'}</span>
        </div>
        {obsError && (
          <div className="error-message">
            Error: {obsError}
          </div>
        )}
      </div>

      {!obsConnected ? (
        <div className="obs-connect-form">
          <div className="form-row">
            <label>Host:</label>
            <input
              type="text"
              value={obsHost}
              onChange={(e) => onHostChange(e.target.value)}
              placeholder="localhost"
            />
          </div>
          <div className="form-row">
            <label>WebSocket Port:</label>
            <input
              type="number"
              value={obsPort}
              onChange={(e) => onPortChange(Number(e.target.value))}
              placeholder="4455"
            />
          </div>
          <div className="form-row">
            <label>Password:</label>
            <input
              type="password"
              value={obsPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="form-row">
            <label>Audio WebSocket Port:</label>
            <input
              type="number"
              value={obsAudioPort}
              onChange={(e) => onAudioPortChange(Number(e.target.value))}
              placeholder="4456"
            />
          </div>
          <button
            className="btn-obs-connect"
            onClick={onConnect}
          >
            Connect to OBS
          </button>
        </div>
      ) : (
        <div className="obs-connected-controls">
          <div className="audio-source-select">
            <label>Select Audio Source:</label>
            <select
              value={selectedSource || ''}
              onChange={(e) => {
                const sourceName = e.target.value;
                if (sourceName) {
                  onSourceSelect(sourceName, obsAudioPort);
                }
              }}
              disabled={!obsAudioSources.length}
            >
              <option value="">-- Select Audio Input --</option>
              {obsAudioSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-obs-disconnect"
            onClick={onDisconnect}
          >
            Disconnect from OBS
          </button>
        </div>
      )}

      <div className="obs-info-box">
        <div className="info-header">ℹ️ OBS WebSocket Setup</div>
        <ul className="info-list">
          <li><strong>Step 1:</strong> Install OBS Studio v28+ (WebSocket 5.0 built-in)</li>
          <li><strong>Step 2:</strong> Tools → WebSocket Server Settings → Enable</li>
          <li><strong>Step 3:</strong> Install <code>obs-audio-to-websocket</code> plugin (see setup guide below)</li>
          <li><strong>Step 4:</strong> Configure to capture OBS mixed output (host + panel + stream)</li>
          <li><strong>Why OBS?</strong> Captures ALL audio so panel members AND host can interact with BetaBot!</li>
          <li><strong>Perfect for</strong>: Interactive streams with Discord panels and audience engagement</li>
        </ul>
      </div>
    </div>
  );
}
