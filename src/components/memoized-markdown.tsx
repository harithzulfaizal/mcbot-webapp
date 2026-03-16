// src/components/MemoizedMarkdown.tsx
import { memo, useMemo, createContext, useContext } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ComponentProps, CSSProperties } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { copyTextToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

type CodeComponentProps = ComponentProps<'code'> & ExtraProps & { inline?: boolean };
type MarkdownSize = 'default' | 'small';

type MarkdownContextValue = {
    size: MarkdownSize;
    onCopy?: (message: string) => void;
};

const MarkdownContext = createContext<MarkdownContextValue>({ size: 'default' });

function normalizeMarkdownContent(content: string) {
    return content
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/:\s{2,}\n(?=\d+\.\s)/g, ':\n\n')
        .replace(/(\d+\.\s[^\n]+?)\s{2,}\n(?=\d+\.\s)/g, '$1\n')
        .trim();
}

const CodeBlock = memo(({ inline, className, children, ...props }: CodeComponentProps) => {
    const { size, onCopy } = useContext(MarkdownContext);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (!inline && match) {
        return (
            <div className="relative my-4 rounded-md border bg-secondary/50">
                <CodeBar lang={match[1]} codeString={codeString} onCopy={onCopy} />
                <SyntaxHighlighter
                    style={oneDark as { [key: string]: CSSProperties }}
                    language={match[1]}
                    PreTag="div"
                    className="!my-0 !p-4 !bg-transparent text-sm rounded-b-md scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full"
                >
                    {codeString}
                </SyntaxHighlighter>
            </div>
        );
    }
    
    const inlineCodeClasses =
        size === 'small'
            ? 'mx-0.5 rounded-md px-1 py-0.5 bg-primary/10 text-foreground font-mono text-xs'
            : 'mx-0.5 rounded-md px-2 py-1 bg-primary/10 text-foreground font-mono';

    return (
        <code className={inlineCodeClasses} {...props}>
            {children}
        </code>
    );
});
CodeBlock.displayName = "CodeBlock";


function CodeBar({
    lang,
    codeString,
    onCopy,
}: {
    lang: string;
    codeString: string;
    onCopy?: (message: string) => void;
}) {
    const copyToClipboard = async () => {
        try {
            await copyTextToClipboard(codeString);
            onCopy?.("Copied code to clipboard");
        } catch (err) {
            console.error('Failed to copy code to clipboard:', err);
        }
    };

    return (
        <div className="flex justify-between items-center px-4 py-1.5 bg-secondary text-secondary-foreground rounded-t-md border-b">
            <span className="text-xs font-mono">{lang}</span>
            <Button onClick={copyToClipboard} variant="ghost" size="icon" className="h-7 w-7">
                <Copy className="w-4 h-4" />
            </Button>
        </div>
    );
}


const MemoizedMarkdown = memo(({
    content,
    id,
    size = 'default',
    onCopy,
}: {
    content: string;
    id: string;
    size?: MarkdownSize;
    onCopy?: (message: string) => void;
}) => {
    const normalizedContent = useMemo(() => normalizeMarkdownContent(content), [content]);
    
    const components: Components = useMemo(() => ({
        code: CodeBlock,
        pre: ({ children }) => <>{children}</>,
        p: ({ children }) => (
            <p
                className={cn(
                    size === 'small'
                        ? 'mb-5 leading-7 last:mb-0'
                        : 'mb-6 leading-8 last:mb-0'
                )}
            >
                {children}
            </p>
        ),
        ol: ({ children }) => (
            <ol
                className={cn(
                    size === 'small'
                        ? 'my-3 list-decimal space-y-2 pl-6'
                        : 'my-4 list-decimal space-y-2.5 pl-7'
                )}
            >
                {children}
            </ol>
        ),
        ul: ({ children }) => (
            <ul
                className={cn(
                    size === 'small'
                        ? 'my-3 list-disc space-y-2 pl-6'
                        : 'my-4 list-disc space-y-2.5 pl-7'
                )}
            >
                {children}
            </ul>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
    }), [size]);

    const proseClasses =
        size === 'small'
            ? 'prose prose-sm dark:prose-invert max-w-none break-words text-[0.95rem] leading-6 prose-headings:my-3 prose-headings:leading-snug prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-[0.95rem] prose-pre:my-3 prose-code:before:content-none prose-code:after:content-none'
            : 'prose prose-base dark:prose-invert max-w-none break-words prose-headings:my-4 prose-headings:leading-snug prose-pre:my-4 prose-code:before:content-none prose-code:after:content-none';

    return (
        <MarkdownContext.Provider value={{ size, onCopy }}>
            <div className={proseClasses} key={id}>
                <ReactMarkdown
                    remarkPlugins={[remarkBreaks, remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={components}
                >
                    {normalizedContent}
                </ReactMarkdown>
            </div>
        </MarkdownContext.Provider>
    );
});

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

export default MemoizedMarkdown;
