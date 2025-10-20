interface BetaBotSuggestion {
  id: string;
  question_text: string;
  context_metadata?: {
    generated_from?: string;
    word_count?: number;
  };
  created_at: string;
}

interface BetaBotSuggestionsProps {
  suggestions: BetaBotSuggestion[];
  onAddToQueue: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

export function BetaBotSuggestions({
  suggestions,
  onAddToQueue,
  onDismiss
}: BetaBotSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="betabot-suggestions">
      <div className="suggestions-header">
        <h4>🤖 BetaBot Suggestions</h4>
        <span className="suggestion-count">{suggestions.length} pending</span>
      </div>
      <div className="suggestions-list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="suggestion-item">
            <div className="suggestion-content">
              <p className="suggestion-text">{suggestion.question_text}</p>
              {suggestion.context_metadata?.generated_from && (
                <p className="suggestion-context">
                  Context: "{suggestion.context_metadata.generated_from.substring(0, 80)}..."
                </p>
              )}
              <p className="suggestion-meta">
                Generated {new Date(suggestion.created_at).toLocaleTimeString()} •
                {suggestion.context_metadata?.word_count || 0} words analyzed
              </p>
            </div>
            <div className="suggestion-actions">
              <button
                className="btn-add-queue"
                onClick={() => onAddToQueue(suggestion.id)}
                title="Add to Popup Queue"
              >
                ➕ Add to Queue
              </button>
              <button
                className="btn-dismiss"
                onClick={() => onDismiss(suggestion.id)}
                title="Dismiss suggestion"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
