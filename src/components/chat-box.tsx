import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import Messages from "./Messages";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

export type Message = {
  id:string;
  sender: "user" | "bot";
  content: string;
  metadata?: Record<string, any>;
  type?: string;
  createdAt?: Date;
};

type User = {
  name: string;
  email: string;
};

interface ChatBoxProps {
  currentUser: User | null;
  sessionId: string;
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

export function ChatBox({ currentUser, sessionId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(sessionId);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentBotMessageId = useRef<string | null>(null);
  const containerRef = useScrollToBottom(messages);

  const [userId, setUserId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showPrompts] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.email) {
      setUserId(currentUser.email);
    }
  }, [currentUser]);

  const stopStreaming = () => {
    console.log("Stop streaming requested (keeping SSE connection alive).");
    setIsBotTyping(false); 
    currentBotMessageId.current = null;
  }

  useEffect(() => {
    if (!userId || !sessionId) return;

    console.log(`Setting up SSE for userId: ${userId}, sessionId: ${sessionId}`);
    const newEventSource = new EventSource(`http://localhost:8000/api/chat/events/${userId}/${sessionId}`);
    eventSourceRef.current = newEventSource;

    newEventSource.onopen = () => {
      console.log("SSE connection established to http://localhost:8000.");
    };
    
    newEventSource.onmessage = (event) => {
        try {
            const parsedData: AgentMessageOutput = JSON.parse(event.data);

            if (parsedData.source === 'user' || parsedData.type !== 'ModelResponse') {
                return;
            }

            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const msgIndex = newMessages.findIndex(m => m.id === currentBotMessageId.current);

                if (msgIndex === -1) {
                    return prevMessages;
                }

                const currentMsg = { ...newMessages[msgIndex] };
                currentMsg.content = parsedData.content;
                newMessages[msgIndex] = currentMsg;
                
                return newMessages;
            });

        } catch (error) {
            console.error("Failed to parse SSE message data:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const msgIndex = newMessages.findIndex(m => m.id === currentBotMessageId.current);
                if (msgIndex !== -1) {
                    newMessages[msgIndex].content = `An error occurred while processing the response.`;
                }
                return newMessages;
            });
            stopStreaming();
        }
    };
    
    const handleStreamEnd = () => {
        console.log("Stream ended (UI update).");
        setIsBotTyping(false);
    };

    newEventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      handleStreamEnd();
    };

    return () => {
      console.log("Closing SSE connection in cleanup.");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      handleStreamEnd();
    };
  }, [userId, sessionId]);

 useEffect(() => {
   if (messages.length > 0) {
     localStorage.setItem(sessionId, JSON.stringify(messages));
   }
 }, [messages, sessionId]);

  const sendMessage = async (input: string) => {
    if (!input.trim() || !userId || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: input,
      createdAt: new Date(),
    };

    const botMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        content: "",
        createdAt: new Date(),
    };
    
    currentBotMessageId.current = botMessage.id;
    setMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
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
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const msgIndex = newMessages.findIndex(m => m.id === currentBotMessageId.current);
        if (msgIndex !== -1) {
            newMessages[msgIndex].content = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
        return newMessages;
      });
      stopStreaming();
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)]">
        <main className="flex flex-col w-full max-w-4xl mx-auto h-full">
            <div ref={containerRef} className="flex-1 overflow-y-auto hide-scrollbar pr-4 -mr-4 pl-4 -ml-4 pb-10">
                <Messages messages={messages} isBotTyping={isBotTyping} />
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
