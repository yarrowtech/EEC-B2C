import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  FileText,
  ListChecks,
  Wallet,
  User,
  LogOut,
  GraduationCap,
  Users,
  Sparkles,
  ChevronRight,
  BookOpen,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    items: [
      { to: "/dashboard/my-chapters", label: "My Chapters", icon: BookOpen },
      { to: "/dashboard/my-payments", label: "My Payments", icon: Wallet },
      { to: "/dashboard/student-engagement", label: "Student Engagement", icon: Users },
    ],
  },
  // {
  //   label: "Resources",
  //   items: [
  //     // { to: "/dashboard/study-materials", label: "Study Materials", icon: Library },
  //     // { to: "/dashboard/study-materials/upload", label: "Upload Materials", icon: Library },
  //   ],
  // },
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
      <SidebarProvider className="teacher-portal">
        <Sidebar
          collapsible="icon"
          className="border-r border-blue-100 bg-[linear-gradient(to_bottom,#eff6ff,#ffffff)] text-slate-900 shadow-sm"
        >
          <SidebarHeader className="px-3 pt-3">
            <div className="rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,#1877f2,#3b82f6)] px-3 py-3 text-white shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <GraduationCap className="size-5" />
                </div>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">Edify Eight</p>
                  </div>
                  <Badge className="h-5 bg-white/15 px-2 text-[10px] font-semibold text-white">Teacher</Badge>
                  {/* <p className="mt-1 text-xs leading-5 text-blue-50">Content workspace and review dashboard</p> */}
                </div>
              </div>
              {/* <div className="mt-3 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white">
                  <Sparkles className="size-3.5 text-blue-100" />
                  Live workspace
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white">
                  <ChevronRight className="size-3.5 text-blue-100" />
                  Quick actions
                </span>
              </div> */}
            </div>
          </SidebarHeader>

          <SidebarContent>
            {NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.label} className="px-3 py-2">
                <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = item.end
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className="rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 data-[active=true]:bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-blue-200"
                          >
                            <NavLink to={item.to} end={item.end} className="flex items-center gap-2.5">
                              <Icon className="size-4" />
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            <SidebarSeparator className="my-3" />

            <SidebarGroup className="px-3 py-2">
              <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                Workspace
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-3 shadow-sm group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-semibold text-blue-950">Teacher Portal</p>
                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Manage chapter content, questions, and payouts from one place.
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-3 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-2xl border border-blue-100 bg-white px-3 py-3 shadow-sm transition hover:bg-blue-50 data-[state=open]:bg-blue-50"
                >
                  <Avatar className="size-9 ring-2 ring-blue-100">
                    <AvatarFallback className="bg-[linear-gradient(135deg,#1877f2,#4f9ef8)] text-white">{getInitial(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold text-blue-950">{user?.name || "Teacher"}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                  </div>
                  <div className="ml-auto rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 group-data-[collapsible=icon]:hidden">
                    Menu
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 rounded-2xl border-blue-100 shadow-lg">
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
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-blue-100 bg-white/85 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <p className="text-sm font-medium text-blue-950">{pageTitleFromPath(location.pathname)}</p>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
