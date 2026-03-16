import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { Message } from '@/components/chat-box'; // Adjusted import path
import { copyTextToClipboard } from '@/lib/clipboard';

interface MessageControlsProps {
  message: Message;
  content: string;
  onCopy: (message: string) => void;
}

export default function MessageControls({
  message,
  content,
  onCopy,
}: MessageControlsProps) {
  const handleCopy = async () => {
    try {
      await copyTextToClipboard(content);
      onCopy("Copied to clipboard");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex gap-1',
        {
          'absolute mt-5 right-2': message.sender === 'user',
          'mt-2': message.sender === 'bot',
        }
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
        <Copy className="w-4 h-4" />
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  );
}
