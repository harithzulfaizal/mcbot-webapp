import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type UserMessageProps = {
  content: string;
};

export function UserMessage({ content }: UserMessageProps) {
  const messageClasses = "inline-block px-4 py-2 bg-[#e9eef6] text-black rounded-tl-lg rounded-bl-lg rounded-br-lg";

  return (
    <div className={messageClasses}>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
