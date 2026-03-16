// src/components/chat-input.tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Using the new Textarea component
import { StopIcon } from "@/components/ui/icons";
import { ArrowUpIcon } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface ChatInputProps {
    onSendMessage: (msg: string) => void;
    isStreaming: boolean;
    stopStreaming: () => void;
}

export function ChatInput({ onSendMessage, isStreaming, stopStreaming }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const collapsedHeight = 56;

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const newHeight = Math.max(collapsedHeight, Math.min(textarea.scrollHeight, 200));
            textarea.style.height = `${newHeight}px`;
        }
    }, [collapsedHeight]);
    
    useEffect(() => {
        adjustHeight();
    }, [message, adjustHeight]);


    const handleSendMessageAndClear = () => {
        if (!message.trim() || isStreaming) return;
        onSendMessage(message.trim());
        setMessage("");
        // Reset height after sending
        const textarea = textareaRef.current;
        if(textarea) {
            textarea.style.height = `${collapsedHeight}px`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessageAndClear();
        }
    };

    return (
        <div className="mx-auto w-full">
            <div className="flex w-full items-center gap-3 rounded-[1.9rem] border border-white/20 bg-background/45 px-5 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/35">
                <Textarea
                    ref={textareaRef}
                    id="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="flex-1 !border-none !shadow-none !ring-0 bg-transparent px-0 py-3 text-base leading-6 placeholder:text-muted-foreground !min-h-[56px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Chat message input"
                />
                {isStreaming ? (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={stopStreaming}
                        aria-label="Stop generating response"
                        className="h-11 w-11 shrink-0 rounded-full self-center"
                    >
                        <StopIcon size={20} />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSendMessageAndClear}
                        variant="default"
                        size="icon"
                        disabled={!message.trim()}
                        aria-label="Send message"
                        className="h-11 w-11 shrink-0 self-center rounded-full bg-[#3A5CCC] text-white hover:bg-[#324EB3]"
                    >
                        <ArrowUpIcon size={18} />
                    </Button>
                )}
            </div>
        </div>
    );
}
