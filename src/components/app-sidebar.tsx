import {
	Trash2,
	LibraryBig,
	MessagesSquare,
	LogOut,
	UserCircle,
	Plus,
	Shield,
} from "lucide-react";
import * as React from "react";

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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthUser } from "@/lib/auth";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	currentUser: AuthUser | null;
	onLogout: () => void;
	sessions: { id: string; name: string }[];
	currentSessionIndex: number;
	onSelectSession: (index: number) => void;
	onOpenLatestSession: () => void;
	onNewConversation: () => void;
	onDeleteSession: (index: number) => void;
}

export function AppSidebar({
	currentUser,
	onLogout,
	sessions,
	currentSessionIndex,
	onSelectSession,
	onOpenLatestSession,
	onNewConversation,
	onDeleteSession,
	...props
}: AppSidebarProps) {
	const navMain = React.useMemo(() => {
		if (!currentUser) {
			return [];
		}
		if (currentUser.isAdmin) {
			return [
				{ title: "Admin", url: "/admin", icon: Shield },
				{ title: "Knowledge Base", url: "/knowledge-base", icon: LibraryBig },
			];
		}
		return [
			{
				title: "Chat",
				url: "/",
				icon: MessagesSquare,
				onClick: onOpenLatestSession,
			},
			{ title: "Knowledge Base", url: "/knowledge-base", icon: LibraryBig },
		];
	}, [currentUser, onOpenLatestSession]);

	const showChatSessions = Boolean(currentUser?.canAccessChat);

	return (
		<Sidebar className="border-r-0" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
				<NavMain items={navMain} />
			</SidebarHeader>

			<SidebarContent className="flex flex-col">
				<div className="flex-grow">
					{showChatSessions ? (
						<SidebarGroup>
							<SidebarGroupLabel>Chat Sessions</SidebarGroupLabel>
							<SidebarMenu>
								{sessions.map((session, index) => (
									<SidebarMenuItem key={session.id}>
										<SidebarMenuButton
											className={
												index === currentSessionIndex ? "font-medium" : ""
											}
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
					) : null}
				</div>
			</SidebarContent>

			{currentUser && (
				// The SidebarFooter itself has a border-t class which acts as the top separator
				<SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
					{/* Removed the redundant SidebarSeparator from here */}
					{/* <SidebarSeparator className="my-2" /> */}
					<div className="flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent transition-colors mt-2">
						{" "}
						{/* Added mt-2 for spacing from top border */}
						<Avatar className="h-9 w-9">
							{/* <AvatarImage src="user_avatar_url_here" alt={currentUser.name} /> */}
							<AvatarFallback className="bg-primary text-primary-foreground">
								{currentUser.name ? (
									currentUser.name
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()
								) : (
									<UserCircle size={20} />
								)}
							</AvatarFallback>
						</Avatar>
						<div className="overflow-hidden">
							<p className="text-sm font-medium text-sidebar-foreground truncate">
								{currentUser.name}
							</p>
							<p className="text-xs text-sidebar-foreground/70 truncate">
								{currentUser.username}
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
