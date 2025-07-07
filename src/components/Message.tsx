// src/components/Message.tsx
import { memo } from 'react';
import MemoizedMarkdown from '@/components/memoized-markdown';
import { cn } from '@/lib/utils';
import { Message as UIMessage } from '@/components/chat-box'; // Adjusted import
import equal from 'fast-deep-equal';
import MessageControls from './message-controls';
import { Skeleton } from './ui/skeleton';

const BotTypingIndicator = () => (
    <div className="flex flex-col items-start space-y-2 max-w-[85%]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
    </div>
);

function PureMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const isLoading = message.sender === 'bot' && !message.content;

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
        {isLoading ? (
            <BotTypingIndicator />
        ) : (
            <>
                {/* Main message body */}
                {message.content && (
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
                )}

                {/* Message controls */}
                {!isStreaming && message.sender === 'bot' && message.content && (
                     <MessageControls
                        message={message}
                        content={message.content}
                    />
                )}
            </>
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
