import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { PromptCards } from "./prompt-card";

type Message = {
  id: number;
  sender: "user" | "bot";
  content: string;
};

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPrompts, setShowPrompts] = useState(true); // 👈 control visibility
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot reply
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        sender: "bot",
        content: input,
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[90vh] border rounded-xl bg-background shadow-md mx-3">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-sm px-4 py-2 rounded-lg ${
              msg.sender === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted text-foreground"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Show prompt cards only before first interaction */}
      {showPrompts && (
        <PromptCards
          onSelect={(prompt) => {
            sendMessage(prompt);
            setShowPrompts(false); // 👈 hide after selection
          }}
        />
      )}
      <div className="border-t p-3">
        <ChatInput
          onSendMessage={(msg) => {
            sendMessage(msg);
            setShowPrompts(false); // 👈 also hide if user types their own
          }}
          onAttachFile={() => {}}
        />
      </div>
    </div>
  );
}
