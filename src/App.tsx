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
import { useLocation } from "react-router-dom";

export default function Page() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
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
                      : ""}
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
        {location.pathname === "/" ? <ChatBox /> : null}
        {location.pathname === "/knowledge-base" ? <KnowledgeBase /> : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
