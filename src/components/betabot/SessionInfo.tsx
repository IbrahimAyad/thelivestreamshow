interface SessionInfoProps {
  sessionTimer: number;
  generatedQuestions: number;
  directInteractions: number;
  totalWords: number;
}

export function SessionInfo({
  sessionTimer,
  generatedQuestions,
  directInteractions,
  totalWords
}: SessionInfoProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="session-info">
      <div className="info-item">
        <span className="label">Session Time</span>
        <span className="value">{formatTime(sessionTimer)}</span>
      </div>
      <div className="info-item">
        <span className="label">Questions</span>
        <span className="value">{generatedQuestions}</span>
      </div>
      <div className="info-item">
        <span className="label">Interactions</span>
        <span className="value">{directInteractions}</span>
      </div>
      <div className="info-item">
        <span className="label">Words</span>
        <span className="value">{totalWords}</span>
      </div>
    </div>
  );
}
