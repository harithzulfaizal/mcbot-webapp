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
            const newHeight = Math.max(36, Math.min(textarea.scrollHeight, 200));
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
            textarea.style.height = '36px';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessageAndClear();
        }
    };

    return (
        <div className="fixed bottom-15 w-full max-w-4xl">
            <div className="flex items-center gap-2 rounded-full px-4 py-2 shadow-sm bg-opacity-80 backdrop-blur-sm w-full">
                <Textarea
                    ref={textareaRef}
                    id="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="flex-1 items-center !border-none !shadow-none !ring-0 bg-transparent text-sm placeholder:text-muted-foreground px-3 !py-0 !min-h-[36px] leading-[36px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Chat message input"
                />
                {isStreaming ? (
                    <Button variant="outline" size="icon" onClick={stopStreaming} aria-label="Stop generating response">
                        <StopIcon size={20} />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSendMessageAndClear}
                        variant="default"
                        size="icon"
                        disabled={!message.trim()}
                        aria-label="Send message"
                        className="bg-[#3A5CCC] hover:bg-[#324EB3] text-white rounded-full"
                    >
                        <ArrowUpIcon size={18} />
                    </Button>
                )}
            </div>
        </div>
    );
}
