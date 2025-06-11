// src/components/MessageReasoning.tsx
import { memo, useState } from 'react';
import MemoizedMarkdown from './memoized-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

function PureMessageReasoning({
  reasoning,
  id,
}: {
  reasoning: string;
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
        <div id={`reasoning-${id}`} className="p-4 rounded-md bg-secondary/50 text-xs border">
          <MemoizedMarkdown content={reasoning} id={id} size="small" />
        </div>
      )}
    </div>
  );
}

export default memo(PureMessageReasoning, (prev, next) => {
  return prev.reasoning === next.reasoning && prev.id === next.id;
});
