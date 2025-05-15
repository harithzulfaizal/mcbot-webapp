// src/App.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Added useNavigate

import { AppSidebar } from "@/components/app-sidebar";
import { NavActions } from "@/components/nav-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatBox } from "./components/chat-bot";
import KnowledgeBase from "./pages/knowledge-base";
import LoginPage from "./pages/LoginPage"; // Import the LoginPage

// Define a type for the user state
type User = {
  name: string;
  email: string;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate(); // For redirecting after login/logout

  // State to hold the current user. null if not logged in.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // State to manage initial loading (e.g., checking for a persisted session)
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for an existing session on component mount
  useEffect(() => {
    // In a real app, you might check localStorage or make an API call
    const storedUser = localStorage.getItem("kijangBotUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("kijangBotUser"); // Clear corrupted data
      }
    }
    setIsLoading(false); // Finished loading
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("kijangBotUser", JSON.stringify(user)); // Persist user
    // No explicit navigation needed here if App component re-renders to show main content
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("kijangBotUser"); // Clear persisted user
    navigate("/"); // Navigate to a common route, LoginPage will be shown due to currentUser being null
  };

  if (isLoading) {
    // Basic loading state
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-white text-xl">Loading application...</p>
      </div>
    );
  }

  if (!currentUser) {
    // If no user is logged in, render the LoginPage
    // LoginPage itself doesn't need access to routing context like useLocation directly
    // as it's rendered outside the main app structure that uses it.
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is logged in, render the main application
  return (
    <SidebarProvider>
      {/* Pass currentUser and handleLogout to AppSidebar */}
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
                      : "Chat"} {/* Default to Chat if path is unknown */}
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
        {/* Conditional rendering of pages based on path */}
        {location.pathname === "/" ? <ChatBox /> : null}
        {location.pathname === "/knowledge-base" ? <KnowledgeBase /> : null}
        {/* Add a fallback for unknown paths within the logged-in app if desired */}
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
