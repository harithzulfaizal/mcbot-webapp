// src/components/MemoizedMarkdown.tsx
import { memo, useMemo, useState, createContext, useContext } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
type MarkdownSize = 'default' | 'small';

// Context to pass size down to components
const MarkdownSizeContext = createContext<MarkdownSize>('default');

const CodeBlock = memo(({ node, inline, className, children, ...props }: CodeComponentProps) => {
    const size = useContext(MarkdownSizeContext);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    if (!inline && match) {
        return (
            <div className="relative my-4 rounded-md border bg-secondary/50">
                <CodeBar lang={match[1]} codeString={codeString} />
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="!my-0 !p-4 !bg-transparent text-sm rounded-b-md scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full"
                    {...props}
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


function CodeBar({ lang, codeString }: { lang: string; codeString: string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(codeString).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy code to clipboard:', err);
        });
    };

    return (
        <div className="flex justify-between items-center px-4 py-1.5 bg-secondary text-secondary-foreground rounded-t-md border-b">
            <span className="text-xs font-mono">{lang}</span>
            <Button onClick={copyToClipboard} variant="ghost" size="icon" className="h-7 w-7">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
        </div>
    );
}


const MemoizedMarkdown = memo(({ content, id, size = 'default' }: { content: string; id: string; size?: MarkdownSize }) => {
    
    const components: Components = useMemo(() => ({
        code: CodeBlock,
        pre: ({ children }) => <>{children}</>,
    }), []);

    const proseClasses =
        size === 'small'
            ? 'prose prose-sm dark:prose-invert break-words max-w-none w-full prose-p:my-2 prose-code:before:content-none prose-code:after:content-none whitespace-pre-wrap'
            : 'prose prose-base dark:prose-invert break-words max-w-none w-full prose-p:leading-relaxed prose-code:before:content-none prose-code:after:content-none whitespace-pre-wrap';

    return (
        <MarkdownSizeContext.Provider value={size}>
            <div className={proseClasses} key={id}>
                 <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={components}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </MarkdownSizeContext.Provider>
    );
});

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

export default MemoizedMarkdown;
