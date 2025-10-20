import { useScarlettAudio } from '../../hooks/useScarlettAudio';
import { ScarlettLEDMeter } from './ScarlettLEDMeter';
import './ScarlettAudioPanel.css';

export function ScarlettAudioPanel() {
  const {
    scarlettInfo,
    audioLevel,
    monitoring,
    gainRecommendation,
    routingStatus,
    backendConnected,
    startMonitoring,
    stopMonitoring,
    detectScarlett,
    verifyRouting
  } = useScarlettAudio();

  return (
    <div className="scarlett-audio-panel">
      <div className="panel-header">
        <h3>🎙️ Scarlett Solo Audio</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className={`connection-status ${backendConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot" />
            <span>Backend {backendConnected ? 'Connected' : 'Offline'}</span>
          </div>
          <div className={`connection-status ${scarlettInfo.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot" />
            <span>Scarlett {scarlettInfo.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {scarlettInfo.connected ? (
        <>
          {/* Device Info */}
          <div className="device-info">
            <div className="info-row">
              <span className="label">Device:</span>
              <span className="value">{scarlettInfo.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Sample Rate:</span>
              <span className="value">{scarlettInfo.sampleRate} Hz</span>
            </div>
            <div className="info-row">
              <span className="label">Channels:</span>
              <span className="value">
                {scarlettInfo.inputChannels} in / {scarlettInfo.outputChannels} out
              </span>
            </div>
          </div>

          {/* LED Meter */}
          <ScarlettLEDMeter
            level={audioLevel.instantaneous}
            peakDb={audioLevel.db}
            label="Microphone Input"
          />

          {/* Gain Recommendation */}
          {gainRecommendation && (
            <div className={`gain-recommendation ${gainRecommendation.status}`}>
              <div className="rec-header">
                <span className="rec-icon">
                  {gainRecommendation.status === 'optimal' ? '✅' :
                   gainRecommendation.status === 'low' ? '⚠️' : '🔴'}
                </span>
                <span className="rec-message">{gainRecommendation.message}</span>
              </div>
              <div className="rec-action">{gainRecommendation.action}</div>
            </div>
          )}

          {/* Audio Routing Status */}
          {routingStatus && (
            <div className="routing-status">
              <h4>Audio Routing</h4>
              <div className="routing-grid">
                <div className={`route-item ${routingStatus.scarlett ? 'active' : ''}`}>
                  <span className="route-icon">{routingStatus.scarlett ? '✅' : '❌'}</span>
                  <span>Scarlett</span>
                </div>
                <div className={`route-item ${routingStatus.blackhole ? 'active' : ''}`}>
                  <span className="route-icon">{routingStatus.blackhole ? '✅' : '❌'}</span>
                  <span>BlackHole</span>
                </div>
                <div className={`route-item ${routingStatus.loopback ? 'active' : ''}`}>
                  <span className="route-icon">{routingStatus.loopback ? '✅' : '❌'}</span>
                  <span>Loopback</span>
                </div>
                <div className={`route-item ${routingStatus.multiOutput ? 'active' : ''}`}>
                  <span className="route-icon">{routingStatus.multiOutput ? '✅' : '❌'}</span>
                  <span>Multi-Output</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="scarlett-controls">
            <button
              className={`btn-monitor ${monitoring ? 'active' : ''}`}
              onClick={monitoring ? stopMonitoring : startMonitoring}
            >
              {monitoring ? '⏹ Stop Monitoring' : '▶️ Start Monitoring'}
            </button>
            <button className="btn-refresh" onClick={verifyRouting}>
              🔄 Verify Routing
            </button>
          </div>

          {/* Hardware Setup Guide */}
          <div className="setup-guide">
            <details>
              <summary>💡 Scarlett Setup Guide</summary>
              <div className="guide-content">
                <h5>Physical Connections:</h5>
                <ul>
                  <li>Mic → <strong>INPUT 1</strong> (XLR or 1/4")</li>
                  <li>USB → Mac</li>
                  <li>Headphones → <strong>HEADPHONES</strong> jack</li>
                </ul>

                <h5>Recommended Settings:</h5>
                <ul>
                  <li><strong>GAIN:</strong> Adjust until green LEDs (avoid red)</li>
                  <li><strong>48V:</strong> ON (for condenser mics)</li>
                  <li><strong>AIR:</strong> ON (adds presence/clarity)</li>
                  <li><strong>MONITOR MIX:</strong> Fully RIGHT (hear everything)</li>
                </ul>

                <h5>Audio Routing:</h5>
                <div className="routing-diagram">
                  <div>Your Mic → Scarlett Input 1 → Multi-Output</div>
                  <div>BetaBot AI → BlackHole → Multi-Output</div>
                  <div>Discord Panel → Discord → Loopback → BetaBot hears</div>
                  <div>All Audio → Scarlett Headphones (zero latency!)</div>
                </div>
              </div>
            </details>
          </div>
        </>
      ) : (
        <div className="not-connected">
          <p>Scarlett Solo not detected</p>
          <button className="btn-detect" onClick={detectScarlett}>
            🔍 Detect Scarlett
          </button>
          <p className="help-text">
            Make sure your Scarlett Solo is connected via USB
          </p>
        </div>
      )}
    </div>
  );
}
