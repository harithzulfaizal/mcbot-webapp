// src/components/MessageControls.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { Message } from '@/components/chat-box'; // Adjusted import path

interface MessageControlsProps {
  message: Message;
  content: string;
}

export default function MessageControls({
  message,
  content,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Using the recommended clipboard command for iframe compatibility
    const textArea = document.createElement("textarea");
    textArea.value = content;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
    document.body.removeChild(textArea);
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
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  );
}
