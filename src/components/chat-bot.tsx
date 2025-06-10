// src/components/chat-bot.tsx
import React, { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import Messages from "./Messages"; // New Messages component

// Define the structure of a message in the chat
export type Message = {
  id: string;
  sender: "user" | "bot";
  content: string;
  thinking?: string;
  metadata?: Record<string, any>;
  type?: string;
  createdAt?: Date; // Added for consistency with MessageControls
};

// Define the structure for the current user prop
type User = {
  name: string;
  email: string;
};

interface ChatBoxProps {
  currentUser: User | null;
}

// Expected structure for data coming from SSE
type AgentMessageOutput = {
  source: string;
  models_usage: Record<string, any> | null;
  metadata: Record<string, any>;
  content: string;
  type: string;
};

export function ChatBox({ currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserId(currentUser.email);
      setSessionId(crypto.randomUUID());
    }
  }, [currentUser]);

  const stopStreaming = () => {
    // This is a placeholder. In a real scenario, you'd have a way to close the EventSource
    // or send a signal to the backend to stop the stream.
    console.log("Stop streaming requested.");
    setIsBotTyping(false);
  }

  useEffect(() => {
    if (!userId || !sessionId) return;

    console.log(`Setting up SSE for userId: ${userId}, sessionId: ${sessionId}`);
    const eventSource = new EventSource(`http://localhost:8000/api/chat/events/${userId}/${sessionId}`);

    eventSource.onopen = () => {
      console.log("SSE connection established to http://localhost:8000.");
    };
    
    let currentMessageId: string | null = null;
    let accumulatedContent = "";
    
    eventSource.onmessage = (event) => {
        setIsBotTyping(true);
        try {
            const parsedData: AgentMessageOutput = JSON.parse(event.data);
            
            // Assuming thinking steps come first or are identifiable
            if (parsedData.type === 'thinking_step') {
                 // You could handle thinking steps here if needed
                 return;
            }

            if (!currentMessageId) {
                // First part of a new message
                currentMessageId = crypto.randomUUID();
                accumulatedContent = parsedData.content;
                const botMessage: Message = {
                    id: currentMessageId,
                    sender: "bot",
                    content: accumulatedContent,
                    thinking: parsedData.metadata ? JSON.stringify(parsedData.metadata, null, 2) : undefined,
                    metadata: parsedData.metadata,
                    type: parsedData.type,
                    createdAt: new Date(),
                };
                setMessages((prevMessages) => [...prevMessages, botMessage]);
            } else {
                // Subsequent parts of the same message stream
                accumulatedContent += parsedData.content;
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === currentMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg
                    )
                );
            }

        } catch (error) {
            console.error("Failed to parse SSE message data:", error);
            const errorBotMessage: Message = {
                id: crypto.randomUUID(),
                sender: "bot",
                content: "An error occurred while processing the response.",
                thinking: `Error: ${error instanceof Error ? error.message : String(error)}\nData: ${event.data}`,
                createdAt: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
            setIsBotTyping(false);
            currentMessageId = null; // Reset on error
        }
    };
    
    // A custom event or a specific message content can signal the end of a stream
    // For now, we'll assume a new message starts a new stream, and errors or closure end it.
    const handleStreamEnd = () => {
        console.log("Stream ended.");
        setIsBotTyping(false);
        currentMessageId = null; // Reset for the next message
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      const errorBotMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        content: "Connection to the chat service was lost or could not be established.",
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
      handleStreamEnd();
      eventSource.close();
    };

    return () => {
      console.log("Closing SSE connection.");
      eventSource.close();
      handleStreamEnd();
    };
  }, [userId, sessionId]);

  const sendMessage = async (input: string) => {
    if (!input.trim() || !userId || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsBotTyping(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input,
          type: "TextMessage",
          source: "user",
          user_id: userId,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to send message." }));
        throw new Error(errorData.detail || response.statusText);
      }
      console.log("Message sent successfully to http://localhost:8000.");
    } catch (error) {
      console.error("Error sending message:", error);
      setIsBotTyping(false);
      const errorBotMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    }
  };

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);
  
  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)]">
        <main className="flex flex-col w-full max-w-4xl pt-10 pb-44 mx-auto h-full">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 pl-4 -ml-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
                <Messages messages={messages} isBotTyping={isBotTyping} />
                <div ref={messagesEndRef} />
            </div>
            <ChatInput 
                onSendMessage={sendMessage}
                isStreaming={isBotTyping}
                stopStreaming={stopStreaming}
            />
        </main>
    </div>
  );
}
