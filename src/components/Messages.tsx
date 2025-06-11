// src/components/Messages.tsx
import { memo } from 'react';
import Message from './message';
import { Message as UIMessage } from '@/components/chat-box'; // Adjusted import path
import equal from 'fast-deep-equal';
import { Skeleton } from './ui/skeleton';

function PureMessages({
  messages,
  isBotTyping,
}: {
  messages: UIMessage[];
  isBotTyping: boolean;
}) {
  return (
    <section className="flex flex-col pt-5 space-y-6">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          isStreaming={isBotTyping && index === messages.length - 1}
        />
      ))}
      {isBotTyping && messages[messages.length - 1]?.sender === 'user' && <BotTypingIndicator />}
    </section>
  );
}

const BotTypingIndicator = () => (
    <div className="flex flex-col items-start space-y-2 max-w-[85%]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
    </div>
);


const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isBotTyping !== nextProps.isBotTyping) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});

Messages.displayName = 'Messages';

export default Messages;

