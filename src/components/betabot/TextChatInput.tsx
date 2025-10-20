interface TextChatInputProps {
  textInput: string;
  sessionId: string | null;
  isResponding: boolean;
  isSpeaking: boolean;
  currentAISource: 'gpt4' | 'perplexity' | null;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function TextChatInput({
  textInput,
  sessionId,
  isResponding,
  isSpeaking,
  currentAISource,
  onTextChange,
  onSubmit
}: TextChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="text-chat-section">
      <h4>💬 Text Chat</h4>
      <div className="chat-input-group">
        <input
          type="text"
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a question for Beta Bot..."
          className="chat-input"
          disabled={!sessionId || isResponding || isSpeaking}
        />
        <button
          className="btn-send"
          onClick={onSubmit}
          disabled={!sessionId || !textInput.trim() || isResponding || isSpeaking}
        >
          Send ➤
        </button>
      </div>
      {currentAISource && (
        <div className={`ai-indicator ${currentAISource}`}>
          {currentAISource === 'gpt4' ? '🟢 Using GPT-4' : '🔴 Using Perplexity (Real-time)'}
        </div>
      )}
    </div>
  );
}
