interface SessionHistoryItem {
  id: string;
  session_name: string;
  total_questions_generated?: number;
  total_direct_interactions?: number;
  total_transcript_words?: number;
}

interface SessionHistoryProps {
  sessionHistory: SessionHistoryItem[];
  showHistory: boolean;
  onToggle: () => void;
}

export function SessionHistory({
  sessionHistory,
  showHistory,
  onToggle
}: SessionHistoryProps) {
  return (
    <div className="history-section">
      <div className="history-header">
        <h4>Session History</h4>
        <button
          className="btn-toggle"
          onClick={onToggle}
        >
          {showHistory ? '▼' : '▶'}
        </button>
      </div>
      {showHistory && (
        <div className="history-list">
          {sessionHistory.length === 0 ? (
            <p className="no-history">No previous sessions</p>
          ) : (
            sessionHistory.map((session) => (
              <div key={session.id} className="history-item">
                <div className="history-name">{session.session_name}</div>
                <div className="history-stats">
                  <span>📝 {session.total_questions_generated || 0}</span>
                  <span>💬 {session.total_direct_interactions || 0}</span>
                  <span>📊 {session.total_transcript_words || 0} words</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
