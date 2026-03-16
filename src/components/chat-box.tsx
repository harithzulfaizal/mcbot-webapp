import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import Messages from "./Messages";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { Session, Message as AppMessage, Citation } from "@/App";
import { AuthUser } from "@/lib/auth";
import { API_BASE_URL, apiUrl } from "@/lib/api";
import { filterInlineCitations } from "@/lib/citations";

export type Message = AppMessage;
export type MessageStep = {
  type: string;
  content: string;
};

interface ChatBoxProps {
  currentUser: AuthUser | null;
  session: Session;
  onSessionMessagesChange: (sessionId: string, messages: Message[]) => void;
}

// Expected structure for data coming from SSE
type AgentMessageOutput = {
  source: string;
  models_usage: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  content: string;
  type: string;
};
export function ChatBox({ currentUser, session, onSessionMessagesChange }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentBotMessageId = useRef<string | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);
  const containerRef = useScrollToBottom(messages);

  const [userId, setUserId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const getCitations = (payload: AgentMessageOutput): Citation[] => {
    const rawCitations = payload.metadata?.citations;
    if (!Array.isArray(rawCitations)) {
      return [];
    }

    const citations = rawCitations.filter(
      (citation): citation is Citation =>
        typeof citation?.index === "number" && typeof citation?.source === "string"
    );
    return filterInlineCitations(payload.content, citations);
  };

  useEffect(() => {
    if (currentUser && currentUser.username) {
      setUserId(currentUser.username);
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const updateMessages = (
    updater: Message[] | ((currentMessages: Message[]) => Message[])
  ) => {
    setMessages((currentMessages) => {
      const nextMessages =
        typeof updater === "function" ? updater(currentMessages) : updater;
      onSessionMessagesChange(session.id, nextMessages);
      return nextMessages;
    });
  };

  const handleCopyFeedback = (message: string) => {
    setCopyFeedback(message);
    if (copyFeedbackTimerRef.current) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
      copyFeedbackTimerRef.current = null;
    }, 2000);
  };

  const stopStreaming = () => {
    console.log("Stop streaming requested (keeping SSE connection alive).");
    setIsBotTyping(false); 
    currentBotMessageId.current = null;
  }

  useEffect(() => {
    if (!userId || !session.id) return;

    console.log(`Setting up SSE for userId: ${userId}, sessionId: ${session.id}`);
    if (!currentUser?.token) return;

    const tokenParam = encodeURIComponent(currentUser.token);
    const newEventSource = new EventSource(
      `${apiUrl(`/api/chat/events/${encodeURIComponent(userId)}/${encodeURIComponent(session.id)}`)}?token=${tokenParam}`
    );
    eventSourceRef.current = newEventSource;

    newEventSource.onopen = () => {
      console.log(`SSE connection established to ${API_BASE_URL}.`);
    };

    const applyAssistantPayload = (payload: AgentMessageOutput) => {
      setMessages((currentMessages) => {
        const newMessages = [...currentMessages];
        const msgIndex = newMessages.findIndex((m) => m.id === currentBotMessageId.current);

        if (msgIndex === -1) {
          return currentMessages;
        }

        const currentMsg = { ...newMessages[msgIndex] };
        currentMsg.content = payload.content;
        currentMsg.metadata = {
          ...currentMsg.metadata,
          citations: getCitations(payload),
        };
        newMessages[msgIndex] = currentMsg;
        onSessionMessagesChange(session.id, newMessages);
        return newMessages;
      });
    };
    
    newEventSource.onmessage = (event) => {
        try {
            const parsedData: AgentMessageOutput = JSON.parse(event.data);

            if (parsedData.source === 'user') {
                return;
            }

            if (parsedData.type === 'ModelResponse' || parsedData.type === 'ModelResponseEnd') {
                applyAssistantPayload(parsedData);
                if (parsedData.type === 'ModelResponseEnd') {
                    handleStreamEnd();
                }
                return;
            }

        } catch (error) {
            console.error("Failed to parse SSE message data:", error);
            setMessages((currentMessages) => {
                const newMessages = [...currentMessages];
                const msgIndex = newMessages.findIndex(m => m.id === currentBotMessageId.current);
                if (msgIndex !== -1) {
                    newMessages[msgIndex].content = `An error occurred while processing the response.`;
                }
                onSessionMessagesChange(session.id, newMessages);
                return newMessages;
            });
            stopStreaming();
        }
    };
    
    const handleStreamEnd = () => {
        console.log("Stream ended (UI update).");
        setIsBotTyping(false);
        currentBotMessageId.current = null;
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
  }, [currentUser?.token, onSessionMessagesChange, session.id, userId]);

  const sendMessage = async (input: string) => {
    if (!input.trim() || !userId || !session.id || !currentUser?.token) return;

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
    updateMessages((prevMessages) => [...prevMessages, userMessage, botMessage]);
    setIsBotTyping(true);

    try {
      const response = await fetch(apiUrl("/api/chat/message"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          content: input,
          type: "TextMessage",
          source: "user",
          user_id: userId,
          session_id: session.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to send message." }));
        throw new Error(errorData.detail || response.statusText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      updateMessages(prev => {
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
    <div className="relative h-[calc(100svh-3.5rem)] w-full overflow-hidden">
        <main className="mx-auto flex h-full w-full flex-col">
            <div ref={containerRef} className="hide-scrollbar flex-1 overflow-y-auto px-4 pb-44">
              <div className="mx-auto w-full md:w-[70%]">
                <Messages
                  messages={messages}
                  isBotTyping={isBotTyping}
                  onCopy={handleCopyFeedback}
                />
              </div>
              {messages.filter(msg => msg.content !== "Connection to the chat service was lost or could not be established.").length === 0 && !isBotTyping && (
                <div className="mx-auto flex min-h-full w-full items-center justify-center px-6 pb-24 pt-12 md:w-[70%]">
                  <div className="max-w-2xl text-center">
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      MCBot
                    </h1>
                    <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                      Chat with MCBot to retrieve information from management committee
                      documents, summarize records, and answer questions grounded in your
                      uploaded materials.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-background via-background/75 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-32 z-30 flex justify-center px-4">
              {copyFeedback ? (
                <div className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm text-foreground shadow-lg backdrop-blur-md">
                  {copyFeedback}
                </div>
              ) : null}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-8 pt-10">
              <div className="mx-auto w-full md:w-[70%]">
                <ChatInput 
                    onSendMessage={sendMessage}
                    isStreaming={isBotTyping}
                    stopStreaming={stopStreaming}
                />
              </div>
              <p className="pt-3 text-center text-xs text-muted-foreground">
                AI generated responses may be incorrect or misleading. Please verify important information.
              </p>
            </div>
        </main>
    </div>
  );
}
