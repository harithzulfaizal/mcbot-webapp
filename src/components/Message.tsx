// src/components/Message.tsx
import { memo } from 'react';
import MemoizedMarkdown from '@/components/memoized-markdown';
import { cn } from '@/lib/utils';
import { Message as UIMessage } from '@/components/chat-box'; // Adjusted import
import equal from 'fast-deep-equal';
import MessageControls from './message-controls';
import MessageReasoning from './message-reasoning';

function PureMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  return (
    <div
      role="article"
      className={cn(
        'group flex flex-col w-full',
        message.sender === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <div
         className={cn(
            'flex flex-col max-w-[100%]',
            message.sender === 'user' ? 'items-end' : 'items-start'
        )}
      >
        {/* Render "thinking" section if available */}
        {message.sender === 'bot' && message.thinking && (
            <MessageReasoning reasoning={message.thinking} id={message.id} />
        )}

        {/* Main message body */}
        <div
            className={cn(
                'px-4 py-3 rounded-xl',
                message.sender === 'user'
                ? 'bg-secondary border border-secondary-foreground/2'
                : 'bg-transparent' // Bot messages have transparent background to let markdown styles show
            )}
        >
            <MemoizedMarkdown content={message.content} id={message.id} />
        </div>

        {/* Message controls */}
        {!isStreaming && message.sender === 'bot' && (
             <MessageControls
                message={message}
                content={message.content}
            />
        )}
      </div>
    </div>
  );
}

const Message = memo(PureMessage, (prevProps, nextProps) => {
    if (prevProps.isStreaming !== nextProps.isStreaming) return false;
    if (!equal(prevProps.message, nextProps.message)) return false;
    return true;
});

Message.displayName = 'Message';

export default Message;
