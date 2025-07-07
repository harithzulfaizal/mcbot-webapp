// src/components/MessageReasoning.tsx
import { memo, useState } from 'react';
import MemoizedMarkdown from './memoized-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MessageStep } from '@/components/chat-box';

function PureMessageReasoning({
  steps,
  id,
}: {
  steps: MessageStep[];
  id: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 pb-2 max-w-4xl w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`reasoning-${id}`}
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span className="text-sm">Show thinking</span>
      </button>
      {isExpanded && (
        <div id={`reasoning-${id}`} className="p-4 rounded-md bg-secondary/50 text-xs border space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="p-4 rounded-md bg-background border">
              <p className="font-semibold mb-2">{step.type}</p>
              <MemoizedMarkdown content={step.content} id={`${id}-step-${index}`} size="small" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(PureMessageReasoning, (prev, next) => {
  return prev.steps === next.steps && prev.id === next.id;
});
