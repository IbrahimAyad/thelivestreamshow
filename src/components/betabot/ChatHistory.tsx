import { FeedbackButtons } from './FeedbackButtons';
import { useBetaBotFeedback } from '../../hooks/useBetaBotFeedback';
import { Brain } from 'lucide-react';

interface ChatHistoryItem {
  question: string;
  answer: string;
  aiSource: 'gpt4' | 'perplexity';
  interactionId?: string;
  hasMemoryRecall?: boolean;
  memoryCount?: number;
}

interface ChatHistoryProps {
  chatHistory: ChatHistoryItem[];
}

export function ChatHistory({ chatHistory }: ChatHistoryProps) {
  const feedback = useBetaBotFeedback();

  const handleFeedback = async (type: 'thumbs_up' | 'thumbs_down', interactionId: string) => {
    await feedback.quickFeedback(type, interactionId);
  };

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
              {chat.hasMemoryRecall && (
                <span className="memory-indicator" title={`Recalled ${chat.memoryCount} past conversation(s)`}>
                  <Brain className="w-3 h-3 text-purple-400" />
                  {chat.memoryCount}
                </span>
              )}
            </div>
            <div className="chat-answer">
              <span className="chat-label">A:</span>
              <span>{chat.answer}</span>
            </div>
            {chat.interactionId && (
              <div className="chat-feedback">
                <FeedbackButtons
                  interactionId={chat.interactionId}
                  onFeedback={(type) => handleFeedback(type, chat.interactionId!)}
                  size="sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
