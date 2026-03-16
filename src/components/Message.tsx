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

const MessageCitations = ({ message }: { message: UIMessage }) => {
  const citations = message.metadata?.citations;

  if (message.sender !== 'bot' || !citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
      {citations.map((citation) => (
        <span
          key={`${message.id}-${citation.index}-${citation.source}`}
          className="rounded-full border border-border/60 bg-secondary/40 px-2 py-1"
        >
          [{citation.index}] {citation.source}
        </span>
      ))}
    </div>
  );
};

function PureMessage({
  message,
  isStreaming,
  onCopy,
}: {
  message: UIMessage;
  isStreaming: boolean;
  onCopy: (message: string) => void;
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
            'flex w-full flex-col',
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
                            'w-fit max-w-full rounded-2xl px-3.5 py-2.5 sm:max-w-[92%] lg:max-w-[85%]',
                            message.sender === 'user'
                            ? 'border border-secondary-foreground/5 bg-secondary'
                            : 'bg-transparent'
                        )}
                    >
                        <MemoizedMarkdown
                          content={message.content}
                          id={message.id}
                          size="small"
                          onCopy={onCopy}
                        />
                        <MessageCitations message={message} />
                    </div>
                )}

                {/* Message controls */}
                {!isStreaming && message.sender === 'bot' && message.content && (
                     <MessageControls
                        message={message}
                        content={message.content}
                        onCopy={onCopy}
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
