// src/components/Messages.tsx
import { memo } from 'react';
import Message from './Message';
import { Message as UIMessage } from '@/components/chat-box'; // Adjusted import path
import equal from 'fast-deep-equal';

function PureMessages({
  messages,
  isBotTyping,
  onCopy,
}: {
  messages: UIMessage[];
  isBotTyping: boolean;
  onCopy: (message: string) => void;
}) {
  return (
    <section className="flex flex-col pt-4 space-y-4">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          isStreaming={isBotTyping && index === messages.length - 1}
          onCopy={onCopy}
        />
      ))}
    </section>
  );
}


const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isBotTyping !== nextProps.isBotTyping) return false;
  if (prevProps.onCopy !== nextProps.onCopy) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});

Messages.displayName = 'Messages';

export default Messages;
