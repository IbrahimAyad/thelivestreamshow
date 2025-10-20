interface AutoGenerationStatusProps {
  wordCount: number;
  autoQuestionGenInterval: number;
}

export function AutoGenerationStatus({
  wordCount,
  autoQuestionGenInterval
}: AutoGenerationStatusProps) {
  const isReady = wordCount >= 50;
  const wordsNeeded = isReady ? 0 : 50 - wordCount;

  return (
    <div className="auto-gen-status">
      <div className="status-header">
        <span className="status-icon">🤖</span>
        <span className="status-text">Auto-Generation Active</span>
        <span className={`status-indicator ${isReady ? 'ready' : 'waiting'}`}>
          {isReady ? 'Ready' : 'Building Context'}
        </span>
      </div>
      <div className="status-detail">
        Next generation in: {autoQuestionGenInterval}s intervals
        {!isReady && (
          <span className="words-needed"> • Need {wordsNeeded} more words</span>
        )}
      </div>
    </div>
  );
}
