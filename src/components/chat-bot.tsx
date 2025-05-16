// ChatBox.tsx
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { PromptCards } from "./prompt-card";
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm';       // Import remark-gfm for GitHub Flavored Markdown
import { UserMessage } from "./user-message";
import { BotMessage } from "./bot-message";

type Message = {
  id: number;
  sender: "user" | "bot";
  content: string; // Content will now be treated as a Markdown string
};

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: input, // Example: "This is **bold** and _italic_."
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowPrompts(false);

    // Simulate bot reply with Markdown
    setTimeout(() => {
      const botReplyContent = `Bot received: ${input}\n\nHere's a list:\n- Item 1\n- Item 2\n\n\`\`\`javascript\nconsole.log("Hello, Markdown!");\n\`\`\``;
      const botMessage: Message = {
        id: Date.now() + Math.random(),
        sender: "bot",
        content: botReplyContent, // Example Markdown content
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  useEffect(() => {
    // Scroll to bottom, but only if there are messages, to avoid scrolling when prompts are shown alone.
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const calculatedInputAreaHeightPx = 76;
  const inputBoxHeightClass = `pb-[${calculatedInputAreaHeightPx}px]`;
  const inputBoxHeightValue = `${calculatedInputAreaHeightPx}px`;

  return (
    <div className="flex flex-col h-[90vh] w-[75%] mx-auto rounded-xl bg-background overflow-hidden">
      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${inputBoxHeightClass}
                    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                    [mask-image:linear-gradient(to_bottom,black_calc(100%-${inputBoxHeightValue}),transparent_100%)]
                    [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-${inputBoxHeightValue}),transparent_100%)]`}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} className="flex"> {/* Outer div for full width */}
              <div className={isUser ? "max-w-[60%] ml-auto" : "mr-auto"}> {/* Inner div for alignment and max width */}
                {isUser ? (
                  <UserMessage content={msg.content} />
                ) : (
                  <BotMessage content={msg.content} thinking="Thinking process/agentic layers go here."/>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* PromptCards Area */}
      {showPrompts && messages.length === 0 && (
        <div className="flex justify-center py-4">
          <PromptCards
            onSelect={(promptText) => {
              sendMessage(promptText);
            }}
          />
        </div>
      )}

      {/* ChatInput container */}
      <div className="sticky p-3 pb-5 bottom-0 backdrop-blur-sm z-10">
        <ChatInput
          onSendMessage={(msg) => {
            sendMessage(msg);
          }}
          onAttachFile={() => {
            console.log("Attach file clicked");
          }}
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI generated responses may be incorrect or misleading. Please verify important information.
        </p>
      </div>
    </div>
  );
}
