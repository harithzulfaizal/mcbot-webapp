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

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const newHeight = Math.max(72, Math.min(textarea.scrollHeight, 200));
            textarea.style.height = `${newHeight}px`;
        }
    }, []);
    
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
            textarea.style.height = '72px';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessageAndClear();
        }
    };

    return (
        <div className="fixed bottom-0 w-full max-w-4xl">
            <div className="bg-secondary rounded-t-[20px] p-2 pb-0 w-full shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.4)]">
                <div className="relative">
                    <div className="flex flex-col">
                        <Textarea
                            ref={textareaRef}
                            id="chat-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            className="w-full pl-4 pr-14 py-3 border-none shadow-none dark:bg-transparent placeholder:text-muted-foreground resize-none focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full min-h-[72px]"
                            aria-label="Chat message input"
                        />
                        <div className="h-14 flex items-center justify-end px-2">
                            {isStreaming ? (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={stopStreaming}
                                    aria-label="Stop generating response"
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
                                >
                                    <ArrowUpIcon size={18} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
