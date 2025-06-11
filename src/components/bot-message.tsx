import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy } from 'lucide-react';

type BotMessageProps = {
  content: string;
  thinking?: string;
};

export function BotMessage({ content, thinking }: BotMessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messageClasses = "px-4 py-2 mr-auto max-w-[100%] bg-transparent text-foreground rounded-lg";

  return (
    <div className={messageClasses}>
      <div className="flex gap-2">
      {/* <Sparkles size={25} className="text-blue-400 mt-1.5" /> */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" size="sm" className="flex items-center gap-1">
            {isOpen ? "Hide thinking" : "Show thinking"}
            <span
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            >
            <ChevronDown size={16} />
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
        <div className="p-2 mt-2 border-l-2 border-muted-foreground">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {thinking}
            </ReactMarkdown>
          </div>
        </div>
        </CollapsibleContent>
      </Collapsible>
      </div>

      <div className="flex items-start gap-2 mt-2">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(content)}
          aria-label="Copy message"
        >
          <Copy size={13} />
        </Button>
      </div>
    </div>
  );
}