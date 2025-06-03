// src/components/chat-bot.tsx
import React, { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { PromptCards } from "./prompt-card";
import { UserMessage } from "./user-message";
import { BotMessage } from "./bot-message";

// Define the structure of a message in the chat
type Message = {
  id: string; // Using string for ID, could be UUID
  sender: "user" | "bot";
  content: string;
  thinking?: string; // For bot's thinking process, displayed in BotMessage
  metadata?: Record<string, any>; // To store any additional metadata from bot messages
  type?: string; // Message type from bot (e.g., "thinking_step", "final_answer")
};

// Define the structure for the current user prop
type User = {
  name: string;
  email: string;
};

interface ChatBoxProps {
  currentUser: User | null; // Passed from App.tsx
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
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false); // To show a typing indicator

  // Initialize userId and sessionId when currentUser is available
  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserId(currentUser.email); // Using email as userId, consider a more stable ID if available
      setSessionId(crypto.randomUUID()); // Generate a unique session ID for this chat session
    }
  }, [currentUser]);

  // Effect for handling Server-Sent Events (SSE)
  useEffect(() => {
    // Only establish SSE connection if userId and sessionId are set
    if (!userId || !sessionId) {
      return;
    }

    console.log(`Setting up SSE for userId: ${userId}, sessionId: ${sessionId}`);
    // Updated to use localhost:8000
    const eventSource = new EventSource(`http://localhost:8000/api/chat/events/${userId}/${sessionId}`);
    setIsBotTyping(true); // Assume bot will start "typing" or processing

    eventSource.onopen = () => {
      console.log("SSE connection established to http://localhost:8000.");
      // setIsBotTyping(false); // Or keep true if waiting for first message
    };

    eventSource.onmessage = (event) => {
      console.log("SSE message received:", event.data);
      setIsBotTyping(false); // Stop typing indicator once a message arrives
      try {
        const parsedData: AgentMessageOutput = JSON.parse(event.data);

        // Extract thinking process from metadata if available
        // This is an example; adjust based on your actual metadata structure
        let thinkingProcess = "";
        if (parsedData.metadata) {
          if (typeof parsedData.metadata.thinking_process === 'string') {
            thinkingProcess = parsedData.metadata.thinking_process;
          } else if (parsedData.metadata.steps || parsedData.metadata.log) {
            // Fallback to stringifying part of metadata or all of it
            thinkingProcess = JSON.stringify(parsedData.metadata.steps || parsedData.metadata.log || parsedData.metadata, null, 2);
          } else {
            thinkingProcess = JSON.stringify(parsedData.metadata, null, 2);
          }
        }

        const botMessage: Message = {
          id: crypto.randomUUID(), // Generate a unique ID for the bot message
          sender: "bot",
          content: parsedData.content,
          thinking: thinkingProcess,
          metadata: parsedData.metadata,
          type: parsedData.type,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Failed to parse SSE message data:", error);
        // Optionally, display a generic error message to the user
        const errorBotMessage: Message = {
          id: crypto.randomUUID(),
          sender: "bot",
          content: "An error occurred while processing the response.",
          thinking: `Error: ${error instanceof Error ? error.message : String(error)}\nData: ${event.data}`
        };
        setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setIsBotTyping(false);
      // Handle errors, e.g., inform the user, try to reconnect, or close
      // For persistent errors, it's important to close the EventSource.
      // Browsers might auto-reconnect, but manual closure can be needed.
      eventSource.close();
      // Display an error message in chat
      const errorBotMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        content: "Connection to the chat service (localhost:8000) was lost or could not be established. Please ensure the backend server is running and accessible. You might need to refresh the page or try sending your message again.",
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    };

    // Cleanup function to close the SSE connection when the component unmounts
    // or when userId/sessionId change (triggering a new connection)
    return () => {
      console.log("Closing SSE connection.");
      eventSource.close();
      setIsBotTyping(false);
    };
  }, [userId, sessionId]); // Dependencies for the effect

  const sendMessage = async (input: string) => {
    if (!input.trim() || !userId || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(), // Generate a unique ID for the user message
      sender: "user",
      content: input,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setShowPrompts(false);
    setIsBotTyping(true); // Show typing indicator after sending a message

    // API call to send the message to the backend
    try {
      // Updated to use localhost:8000
      const response = await fetch("http://localhost:8000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: input,
          type: "TextMessage", // As per ChatMessageInput schema
          source: "user",     // As per ChatMessageInput schema
          user_id: userId,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to send message. Unknown error." }));
        console.error("Failed to send message:", response.status, errorData);
        setIsBotTyping(false);
        // Display an error message in chat
        const errorBotMessage: Message = {
          id: crypto.randomUUID(),
          sender: "bot",
          content: `Error sending message to localhost:8000: ${errorData.detail || response.statusText}`,
        };
        setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
        return;
      }
      // Backend will send response via SSE, no need to process POST response content here for chat display
      console.log("Message sent successfully to http://localhost:8000.");
    } catch (error) {
      console.error("Error sending message:", error);
      setIsBotTyping(false);
      const errorBotMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        content: `An error occurred while trying to send message to localhost:8000: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const calculatedInputAreaHeightPx = 76;
  const inputBoxHeightClass = `pb-[${calculatedInputAreaHeightPx}px]`;
  const inputBoxHeightValue = `${calculatedInputAreaHeightPx}px`;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-[75%] mx-auto rounded-xl bg-background overflow-hidden"> {/* Adjusted height to fill viewport minus header */}
      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${inputBoxHeightClass}
                    [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent
                    [mask-image:linear-gradient(to_bottom,black_calc(100%-${inputBoxHeightValue}),transparent_100%)]
                    [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-${inputBoxHeightValue}),transparent_100%)]`}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} className="flex">
              <div className={isUser ? "max-w-[70%] ml-auto" : "max-w-[70%] mr-auto"}> {/* Adjusted max-width for better readability */}
                {isUser ? (
                  <UserMessage content={msg.content} />
                ) : (
                  <BotMessage content={msg.content} thinking={msg.thinking} />
                )}
              </div>
            </div>
          );
        })}
        {isBotTyping && (
          <div className="flex">
            <div className="max-w-[70%] mr-auto">
              <BotMessage content=" KijangBot is thinking..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* PromptCards Area - shown only if no messages and prompts are enabled */}
      {showPrompts && messages.length === 0 && !isBotTyping && (
        <div className="flex justify-center py-4">
          <PromptCards
            onSelect={(promptText) => {
              sendMessage(promptText);
            }}
          />
        </div>
      )}

      {/* ChatInput container */}
      <div className="sticky p-3 pb-5 bottom-0 backdrop-blur-sm z-10 bg-background/80"> {/* Added bg for better visibility with backdrop */}
        <ChatInput
          onSendMessage={(msg) => {
            sendMessage(msg);
          }}
          onAttachFile={() => {
            console.log("Attach file clicked - feature not implemented");
            // You could add a message to the chat indicating this feature is not implemented
            const attachMessage: Message = {
              id: crypto.randomUUID(),
              sender: "bot",
              content: "File attachment is not yet implemented in this demo.",
            };
            setMessages(prev => [...prev, attachMessage]);
          }}
        />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI generated responses may be incorrect or misleading. Please verify important information.
        </p>
      </div>
    </div>
  );
}
