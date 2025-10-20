interface APIHealthStatusProps {
  betaBotStatus: 'healthy' | 'warning' | 'error';
  whisperAvailable: boolean;
}

export function APIHealthStatus({
  betaBotStatus,
  whisperAvailable
}: APIHealthStatusProps) {
  return (
    <div className="api-health">
      <h4>API Status</h4>
      <div className="health-grid">
        <div className={`health-item ${betaBotStatus}`}>
          <span>BetaBot (GPT-4o)</span>
          <span className="health-dot" />
        </div>
        <div className={`health-item ${whisperAvailable ? 'healthy' : 'warning'}`}>
          <span>Whisper</span>
          <span className="health-dot" />
        </div>
      </div>
    </div>
  );
}
