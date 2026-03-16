import { useEffect, useState } from "react";
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
import LoginPage from "./pages/login-page";
import KnowledgeBasePage from "./pages/knowledge-base";
import SetupPasswordPage from "./pages/setup-password-page";
import AdminPage from "./pages/admin-page";
import { AuthUser, profileToAuthUser, UserProfile } from "./lib/auth";
import { apiUrl } from "./lib/api";
import { filterInlineCitations } from "./lib/citations";

export type Citation = {
  index: number;
  source: string;
};

type MessageMetadata = {
  citations?: Citation[];
  [key: string]: unknown;
};

export type Message = {
  id: string;
  sender: "user" | "bot";
  content: string;
  metadata?: MessageMetadata;
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
          content: unknown;
          type: string;
        }[];
      };
    };
  };
};

type AssistantPayload = {
  answer?: unknown;
  citations?: unknown;
};

const DEFAULT_SESSION_NAME = "New Conversation";

const createEmptySession = (): Session => ({
  id: crypto.randomUUID(),
  name: DEFAULT_SESSION_NAME,
  messages: [],
});

const getSessionName = (messages: Message[]) =>
  messages.find((message) => message.sender === "user")?.content || DEFAULT_SESSION_NAME;

const parseAssistantPayload = (rawContent: unknown): {
  content: string;
  citations: Citation[];
} => {
  if (typeof rawContent !== "string") {
    return { content: "Error displaying message.", citations: [] };
  }

  const fencedMatch = rawContent.match(/^```json\s*([\s\S]*?)\s*```$/);
  const normalizedContent = fencedMatch ? fencedMatch[1] : rawContent;

  try {
    const parsedContent = JSON.parse(normalizedContent) as AssistantPayload;
    const citations = Array.isArray(parsedContent.citations)
      ? parsedContent.citations.filter(
          (citation): citation is Citation =>
            typeof citation === "object" &&
            citation !== null &&
            typeof (citation as Citation).index === "number" &&
            typeof (citation as Citation).source === "string"
        )
      : [];
    const content =
      typeof parsedContent.answer === "string" ? parsedContent.answer : "";

    return {
      content,
      citations: filterInlineCitations(content, citations),
    };
  } catch (error) {
    console.error("Failed to parse bot message content:", error);
    return { content: "Error displaying message.", citations: [] };
  }
};

const isValidAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const user = value as Record<string, unknown>;
  return typeof user.username === "string" && typeof user.token === "string";
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  useEffect(() => {
    const hydrateStoredUser = async () => {
      const storedUser = localStorage.getItem("kijangBotUser");
      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        if (!isValidAuthUser(parsed)) {
          localStorage.removeItem("kijangBotUser");
          setIsLoading(false);
          return;
        }

        if (typeof parsed.canAccessChat === "boolean" && typeof parsed.isAdmin === "boolean") {
          setCurrentUser(parsed as AuthUser);
          setIsLoading(false);
          return;
        }

        const response = await fetch(apiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${parsed.token}` },
        });
        const profile = await response.json().catch(() => ({}));
        if (!response.ok) {
          localStorage.removeItem("kijangBotUser");
          setIsLoading(false);
          return;
        }
        const user = profileToAuthUser(profile as UserProfile, parsed.token);
        setCurrentUser(user);
        localStorage.setItem("kijangBotUser", JSON.stringify(user));
      } catch (e) {
        console.error("Failed to restore stored user:", e);
        localStorage.removeItem("kijangBotUser");
      } finally {
        setIsLoading(false);
      }
    };

    hydrateStoredUser();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    if (currentUser.isAdmin && location.pathname === "/") {
      navigate("/admin", { replace: true });
    } else if (!currentUser.isAdmin && location.pathname === "/admin") {
      navigate("/", { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem("kijangBotUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSessions([]);
    localStorage.removeItem("kijangBotUser");
    navigate("/");
  };

  useEffect(() => {
    if (!currentUser?.canAccessChat) {
      setSessions([]);
      setCurrentSessionIndex(0);
      return;
    }

    const fetchSessions = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/sessions/${encodeURIComponent(currentUser.username)}`),
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );
        if (!response.ok) {
          if (response.status === 401) {
            setCurrentUser(null);
            localStorage.removeItem("kijangBotUser");
            return;
          }
          throw new Error(`Failed to fetch sessions: ${response.statusText}`);
        }
        const data: ApiSession[] = await response.json();

        if (data.length > 0) {
          const transformedSessions = data.map((session) => {
            const agentStateKey = Object.keys(session.state.agent_states).find((k) =>
              k.startsWith("group_chat_manager")
            );
            const messageThread = agentStateKey
              ? session.state.agent_states[agentStateKey].message_thread
              : [];

            let lastMessageWasUser = false;
            const processedMessages: Message[] = [];

            messageThread.forEach((msg, index) => {
              if (msg.source === "user") {
                processedMessages.push({
                  id: `${session.session_id}-${index}`,
                  sender: "user",
                  content: typeof msg.content === "string" ? msg.content : "",
                  type: msg.type,
                });
                lastMessageWasUser = true;
              } else if (msg.source === "SummarizerAgent" && lastMessageWasUser) {
                const { content, citations } = parseAssistantPayload(msg.content);
                processedMessages.push({
                  id: `${session.session_id}-${index}`,
                  sender: "bot",
                  content,
                  metadata: { citations },
                  type: msg.type,
                });
                lastMessageWasUser = false;
              }
            });

            return {
              id: session.session_id,
              name: getSessionName(processedMessages),
              messages: processedMessages,
            };
          });
          setSessions(transformedSessions);
          setCurrentSessionIndex(0);
        } else {
          setSessions([createEmptySession()]);
          setCurrentSessionIndex(0);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([createEmptySession()]);
        setCurrentSessionIndex(0);
      }
    };

    fetchSessions();
  }, [currentUser]);

  const handleNewConversation = () => {
    if (!currentUser?.canAccessChat) {
      return;
    }
    const newSession = createEmptySession();
    setSessions((prev) => {
      const nextSessions = [...prev, newSession];
      setCurrentSessionIndex(nextSessions.length - 1);
      return nextSessions;
    });
  };

  const handleSelectSession = (index: number) => {
    setCurrentSessionIndex(index);
  };

  const handleOpenLatestSession = () => {
    if (!currentUser?.canAccessChat) {
      return;
    }

    setCurrentSessionIndex(0);
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const updateSessionMessages = (sessionId: string, messages: Message[]) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages,
              name: getSessionName(messages),
            }
          : session
      )
    );
  };

  const handleDeleteSession = async (index: number) => {
    if (!currentUser?.canAccessChat) {
      return;
    }
    const sessionToDelete = sessions[index];
    if (!sessionToDelete) {
      return;
    }

    try {
      const response = await fetch(
        apiUrl(
          `/api/sessions/${encodeURIComponent(currentUser.username)}/${encodeURIComponent(
            sessionToDelete.id
          )}`
        ),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      return;
    }

    const updated = sessions.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setSessions([createEmptySession()]);
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

  if (location.pathname === "/setup-password") {
    return <SetupPasswordPage />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-xl text-white">Loading application...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const pageTitle =
    location.pathname === "/"
      ? "Chat"
      : location.pathname === "/knowledge-base"
      ? "Knowledge Base"
      : location.pathname === "/admin"
      ? "Admin"
      : "Page";

  return (
    <SidebarProvider>
      <AppSidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        sessions={sessions}
        currentSessionIndex={currentSessionIndex}
        onSelectSession={handleSelectSession}
        onOpenLatestSession={handleOpenLatestSession}
        onNewConversation={handleNewConversation}
        onDeleteSession={handleDeleteSession}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {location.pathname === "/" && currentUser.canAccessChat ? (
            <div className="ml-auto px-3">
              <NavActions onNewConversation={handleNewConversation} />
            </div>
          ) : null}
        </header>
        {location.pathname === "/" && currentUser.canAccessChat && sessions.length > 0 ? (
          <ChatBox
            key={sessions[currentSessionIndex].id}
            session={sessions[currentSessionIndex]}
            currentUser={currentUser}
            onSessionMessagesChange={updateSessionMessages}
          />
        ) : null}
        {location.pathname === "/" && !currentUser.canAccessChat ? (
          <div className="p-6">
            <h2 className="text-lg font-semibold">Chat unavailable</h2>
            <p>This account does not have access to the chat module.</p>
          </div>
        ) : null}
        {location.pathname === "/knowledge-base" ? (
          <KnowledgeBasePage currentUser={currentUser} />
        ) : null}
        {location.pathname === "/admin" && currentUser.isAdmin ? (
          <AdminPage currentUser={currentUser} />
        ) : null}
        {location.pathname !== "/" &&
        location.pathname !== "/knowledge-base" &&
        location.pathname !== "/admin" ? (
          <div className="p-4">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p>The page you are looking for does not exist within the MC Bot application.</p>
          </div>
        ) : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
