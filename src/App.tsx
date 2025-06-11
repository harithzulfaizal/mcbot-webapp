// src/App.tsx
import React, { useState, useEffect } from "react";
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
import KnowledgeBase from "./pages/knowledge-base";
import LoginPage from "./pages/login-page";

// Define a type for the user state
type User = {
  name: string;
  email: string;
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
      <AppSidebar currentUser={currentUser} onLogout={handleLogout} />
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
              <NavActions />
            </div>
          )}
        </header>
        {/* The ChatBox now controls its own width and can be placed directly */}
        {location.pathname === "/" ? <ChatBox currentUser={currentUser} /> : null}
        {location.pathname === "/knowledge-base" ? <KnowledgeBase /> : null}
        {location.pathname !== "/" && location.pathname !== "/knowledge-base" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p>The page you are looking for does not exist within the KijangBot application.</p>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
