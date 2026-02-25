// src/App.tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "./components/app-sidebar";
import { NavActions } from "./components/nav-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "./components/ui/breadcrumb";
import { Separator } from "./components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { ChatBox } from "./components/chat-box";
import KnowledgeBasePage from "./pages/knowledge-base";
import LoginPage from "./pages/login-page";

// Define a type for the user state
type User = {
  name: string;
  email: string;
};

// Define types for session data
export type Message = {
  id: string;
  sender: "user" | "bot";
  content: string;
  metadata?: Record<string, any>;
  type?: string;
  createdAt?: Date;
};

export type Session = {
  id: string;
  name: string;
  messages: Message[];
};

type ApiSession = {
  session_id: string;
  state: {
    agent_states: {
      [key: string]: {
        message_thread: {
          source: string;
          content: any;
          type: string;
        }[];
      };
    };
  };
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("kijangBotUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("kijangBotUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("kijangBotUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("kijangBotUser");
    navigate("/");
  };

  // Chat session management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  useEffect(() => {
    if (currentUser) {
      const fetchSessions = async () => {
        console.log("Fetching sessions for:", currentUser.email);
        try {
          const response = await fetch(`/api/sessions/${currentUser.email}`);
          console.log("Fetch response:", response);
          if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.statusText}`);
          }
          const data: ApiSession[] = await response.json();
          console.log("Fetched session data:", data);

          if (data.length > 0) {
            const transformedSessions = data.map((session) => {
              const agentStateKey = Object.keys(session.state.agent_states).find(k => k.startsWith("group_chat_manager"));
              const messageThread = agentStateKey ? session.state.agent_states[agentStateKey].message_thread : [];

              let lastMessageWasUser = false;
              const processedMessages: Message[] = [];

              messageThread.forEach((msg, index) => {
                if (msg.source === 'user') {
                  processedMessages.push({
                    id: `${session.session_id}-${index}`,
                    sender: "user",
                    content: msg.content,
                    type: msg.type,
                  });
                  lastMessageWasUser = true;
                } else if (msg.source === 'SummarizerAgent' && lastMessageWasUser) {
                  let content = "";
                  try {
                    const cleanedContent = msg.content.replace(/```json\n|```/g, '').trim();
                    const parsedContent = JSON.parse(cleanedContent);
                    content = parsedContent.answer;
                  } catch (e) {
                    console.error("Failed to parse bot message content:", e);
                    content = "Error displaying message.";
                  }
                  processedMessages.push({
                    id: `${session.session_id}-${index}`,
                    sender: "bot",
                    content: content,
                    type: msg.type,
                  });
                  lastMessageWasUser = false; // Reset after processing the first agent message
                }
              });

              const firstUserMessage = processedMessages.find(
                (msg) => msg.sender === "user"
              );
              
              const messages = processedMessages;

              return {
                id: session.session_id,
                name: (firstUserMessage?.content as string) || "New Conversation",
                messages,
              };
            });
            console.log("Transformed sessions:", transformedSessions);
            setSessions(transformedSessions);
          } else {
            console.log("No sessions found, creating a new one.");
            setSessions([{ id: crypto.randomUUID(), name: "New Conversation", messages: [] }]);
          }
        } catch (error) {
          console.error("Error fetching sessions:", error);
          setSessions([{ id: crypto.randomUUID(), name: "New Conversation", messages: [] }]);
        }
      };
      fetchSessions();
    }
  }, [currentUser]);

  const handleNewConversation = () => {
    const newSession = { id: crypto.randomUUID(), name: "New Conversation", messages: [] };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length);
  };

  const handleSelectSession = (index: number) => {
    setCurrentSessionIndex(index);
  };

  const handleDeleteSession = (index: number) => {
    const updated = sessions.filter((_, i) => i !== index);
    if (updated.length === 0) {
      const defaultSession = { id: crypto.randomUUID(), name: "New Conversation", messages: [] };
      setSessions([defaultSession]);
      setCurrentSessionIndex(0);
    } else {
      setSessions(updated);
      setCurrentSessionIndex((prev) => {
        if (index === prev) return 0;
        if (index < prev) return prev - 1;
        return prev;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-white text-xl">Loading application...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        sessions={sessions}
        currentSessionIndex={currentSessionIndex}
        onSelectSession={handleSelectSession}
        onNewConversation={handleNewConversation}
        onDeleteSession={handleDeleteSession}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    {location.pathname === "/"
                      ? "Chat"
                      : location.pathname === "/knowledge-base"
                      ? "Knowledge Base"
                      : "Chat"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {location.pathname === "/" && (
            <div className="ml-auto px-3">
              <NavActions onNewConversation={handleNewConversation} />
            </div>
          )}
        </header>
        {/* The ChatBox now controls its own width and can be placed directly */}
        {location.pathname === "/" && sessions.length > 0 && (
          <ChatBox
            key={sessions[currentSessionIndex].id}
            session={sessions[currentSessionIndex]}
            currentUser={currentUser}
          />
        )}
        {location.pathname === "/knowledge-base" ? <KnowledgeBasePage currentUser={currentUser} /> : null}
        {location.pathname !== "/" && location.pathname !== "/knowledge-base" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p>The page you are looking for does not exist within the MC Bot application.</p>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
