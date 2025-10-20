interface ChatHistoryItem {
  question: string;
  answer: string;
  aiSource: 'gpt4' | 'perplexity';
}

interface ChatHistoryProps {
  chatHistory: ChatHistoryItem[];
}

export function ChatHistory({ chatHistory }: ChatHistoryProps) {
  if (chatHistory.length === 0) return null;

  return (
    <div className="chat-history">
      <h4>Recent Conversations</h4>
      <div className="chat-list">
        {chatHistory.map((chat, index) => (
          <div key={index} className="chat-item">
            <div className="chat-question">
              <span className="chat-label">Q:</span>
              <span>{chat.question}</span>
              <span className={`chat-ai-badge ${chat.aiSource}`}>
                {chat.aiSource === 'gpt4' ? 'GPT-4' : 'Perplexity'}
              </span>
            </div>
            <div className="chat-answer">
              <span className="chat-label">A:</span>
              <span>{chat.answer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
