// src/components/app-sidebar.tsx
import {
  AudioWaveform,
  Command,
  MessageCircleQuestion,
  Settings2,
  Trash2,
  LibraryBig,
  MessagesSquare,
  LogOut,
  UserCircle,
  Plus,
} from "lucide-react";
import * as React from "react";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  // SidebarSeparator, // No longer needed here if footer has border-t
} from "@/components/ui/sidebar";
import { NavWorkspaces } from "./nav-workspaces";
// Button component might not be needed if SidebarMenuButton is styled appropriately
// import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type User = {
  name: string;
  email: string;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentUser: User | null;
  onLogout: () => void;
  sessions: { id: string; name: string }[];
  currentSessionIndex: number;
  onSelectSession: (index: number) => void;
  onNewConversation: () => void;
  onDeleteSession: (index: number) => void;
}

const data = {
  teams: [
    { name: "MCBot", logo: Command, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Evil Corp.", logo: Command, plan: "Free" },
  ],
  navMain: [
    { title: "Chat", url: "/", icon: MessagesSquare },
    { title: "Knowledge Base", url: "/knowledge-base", icon: LibraryBig },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: Settings2 },
    { title: "Help", url: "#", icon: MessageCircleQuestion },
  ],
  favorites: [
    { name: "Monetary Policy Committee Minutes", url: "#", emoji: "📝" },
    { name: "Inflation Forecast & Analysis", url: "#", emoji: "📈" },
    // ... other favorites
  ],
  workspaces: [
    {
      name: "Personal Life Management",
      emoji: "🏠",
      pages: [
        { name: "Daily Journal & Reflection", url: "#", emoji: "📔" },
        // ... other pages
      ],
    },
    // ... other workspaces
  ],
};

export function AppSidebar({
  currentUser,
  onLogout,
  sessions,
  currentSessionIndex,
  onSelectSession,
  onNewConversation,
  onDeleteSession,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <div className="flex-grow">
          {/* Chat Sessions Group */}
          <SidebarGroup>
            <SidebarGroupLabel>Chat Sessions</SidebarGroupLabel>
            <SidebarMenu>
              {sessions.map((session, index) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    className={index === currentSessionIndex ? "font-medium" : ""}
                    onClick={() => onSelectSession(index)}
                  >
                    <span>{session.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover>
                    <Trash2
                      className="text-muted-foreground"
                      onClick={() => onDeleteSession(index)}
                    />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewConversation}>
                  <Plus className="mr-2 h-4 w-4" /> New Conversation
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <NavFavorites favorites={data.favorites} />
          <NavWorkspaces workspaces={data.workspaces} />
        </div>
      </SidebarContent>

      {currentUser && (
        // The SidebarFooter itself has a border-t class which acts as the top separator
        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
          {/* Removed the redundant SidebarSeparator from here */}
          {/* <SidebarSeparator className="my-2" /> */}
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent transition-colors mt-2"> {/* Added mt-2 for spacing from top border */}
            <Avatar className="h-9 w-9">
              {/* <AvatarImage src="user_avatar_url_here" alt={currentUser.name} /> */}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser.name
                  ? currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : <UserCircle size={20} />}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
          <SidebarMenu className="mt-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onLogout}
                className="w-full justify-start text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
