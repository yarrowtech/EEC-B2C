import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Send,
  FileText,
  ListChecks,
  Wallet,
  Library,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: Home, end: true }],
  },
  {
    label: "Create & Submit",
    items: [
      // { to: "/dashboard/submit-chapter", label: "Submit Chapter", icon: Send },
      { to: "/dashboard/add-chapter-workspace", label: "Add Content & Questions", icon: FileText },
      { to: "/dashboard/questions/list", label: "All Questions", icon: ListChecks },
    ],
  },
  {
    label: "My Work",
    items: [{ to: "/dashboard/my-payments", label: "My Payments", icon: Wallet }],
  },
  {
    label: "Resources",
    items: [
      // { to: "/dashboard/study-materials", label: "Study Materials", icon: Library },
      { to: "/dashboard/study-materials/upload", label: "Upload Materials", icon: Library },
    ],
  },
];

function pageTitleFromPath(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches = item.end ? pathname === item.to : pathname.startsWith(item.to);
      if (matches) return item.label;
    }
  }
  return "Dashboard";
}

function getInitial(name) {
  return String(name || "T").trim().charAt(0).toUpperCase() || "T";
}

export default function TeacherDashboardLayout({ user, onLogout }) {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4.5" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold">Edify Eight</p>
                <p className="truncate text-xs text-muted-foreground">Teacher Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = item.end
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                            <NavLink to={item.to} end={item.end}>
                              <Icon />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <Avatar className="size-7">
                    <AvatarFallback>{getInitial(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-medium">{user?.name || "Teacher"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/profile">
                    <User className="mr-2 size-4" />
                    Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <p className="text-sm font-medium">{pageTitleFromPath(location.pathname)}</p>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
