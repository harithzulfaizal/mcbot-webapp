import React, { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import Messages from "./messages"; 

export type Message = {
  id: string;
  sender: "user" | "bot";
  content: string;
  thinking?: string;
  metadata?: Record<string, any>;
  type?: string;
  createdAt?: Date; // Added for consistency with MessageControls
};

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

import { PromptCards } from "./prompt-card";

export function ChatBox({ currentUser }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null); // Added useRef for EventSource

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserId(currentUser.email);
      setSessionId(crypto.randomUUID());
    }
  }, [currentUser]);

  const stopStreaming = () => {
    console.log("Stop streaming requested (keeping SSE connection alive).");
    setIsBotTyping(false); 
  }

  useEffect(() => {
    if (!userId || !sessionId) return;

    console.log(`Setting up SSE for userId: ${userId}, sessionId: ${sessionId}`);
    const newEventSource = new EventSource(`http://localhost:8000/api/chat/events/${userId}/${sessionId}`);
    eventSourceRef.current = newEventSource; // Store EventSource in ref

    newEventSource.onopen = () => {
      console.log("SSE connection established to http://localhost:8000.");
    };
    
    let currentMessageId: string | null = null;
    let accumulatedContent = "";
    
    newEventSource.onmessage = (event) => {
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

            // Check if the message type is ModelResponse to stop streaming
            if (parsedData.type === 'ModelResponse') {
                console.log("ModelResponse received, re-enabling input.");
                stopStreaming(); 
                handleStreamEnd(); // Ensure UI updates correctly after stopping
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
        console.log("Stream ended (UI update).");
        setIsBotTyping(false); // Ensure input is enabled
        currentMessageId = null; // Reset for the next message
        // No need to close eventSourceRef.current here as stopStreaming handles it or the natural close does.
    };

    newEventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      // Do not add error message to chat messages, just log to console
      handleStreamEnd();
      // newEventSource.close(); // stopStreaming or the return function will handle this
      // if (eventSourceRef.current === newEventSource) { // Only close if it's the current one
      //   newEventSource.close();
      //   eventSourceRef.current = null;
      // }
    };

    return () => {
      console.log("Closing SSE connection in cleanup.");
      // newEventSource.close();
      if (eventSourceRef.current === newEventSource) { // Ensure we only close the one created in this effect
        newEventSource.close(); // Close SSE on component unmount or dependency change
        eventSourceRef.current = null;
      }
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
        <main className="flex flex-col w-full max-w-4xl mx-auto h-full">
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 pl-4 -ml-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-thumb-rounded-full">
                <Messages messages={messages} isBotTyping={isBotTyping} />
                <div ref={messagesEndRef} />
            </div>
            {showPrompts && messages.filter(msg => msg.content !== "Connection to the chat service was lost or could not be established.").length === 0 && !isBotTyping && (
            <div className="flex justify-center py-4">
              <PromptCards
                onSelect={(promptText) => {
                  sendMessage(promptText);
                }}
              />
            </div>
            )}
            <ChatInput 
                onSendMessage={sendMessage}
                isStreaming={isBotTyping}
                stopStreaming={stopStreaming}
            />
            <p className="text-xs text-muted-foreground py-8 text-center">
              AI generated responses may be incorrect or misleading. Please verify important information.
            </p>
        </main>
    </div>
  );
}
