"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Zap,
  FileText,
  TrendingUp,
  Briefcase,
  Shield,
  LineChart,
  History,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createClient } from "@/lib/supabase/client";

interface NavSubItem {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  {
    href: "/app/oms",
    label: "Orders",
    icon: FileText,
    subItems: [
      { href: "/app/oms", label: "Dashboard" },
      { href: "/app/oms/orders", label: "Order Blotter" },
    ],
  },
  {
    href: "/app/ems",
    label: "Executions",
    icon: TrendingUp,
    subItems: [
      { href: "/app/ems", label: "Dashboard" },
      { href: "/app/ems/executions", label: "Execution Tape" },
    ],
  },
  {
    href: "/app/pms",
    label: "Portfolios",
    icon: Briefcase,
    subItems: [
      { href: "/app/pms", label: "Dashboard" },
      { href: "/app/pms/accounts", label: "Accounts" },
      { href: "/app/pms/households", label: "Households" },
      { href: "/app/pms/models", label: "Models" },
      { href: "/app/pms/proposals", label: "Proposals" },
      { href: "/app/pms/optimization", label: "Optimization" },
      { href: "/app/pms/rebalancing", label: "Rebalancing" },
      { href: "/app/pms/drift", label: "Drift Analysis" },
    ],
  },
  {
    href: "/app/compliance",
    label: "Compliance",
    icon: Shield,
    subItems: [
      { href: "/app/compliance", label: "Dashboard" },
      { href: "/app/compliance/rules", label: "Rules" },
      { href: "/app/compliance/violations", label: "Violations" },
    ],
  },
  {
    href: "/app/marketdata",
    label: "Market Data",
    icon: LineChart,
    subItems: [
      { href: "/app/marketdata", label: "Dashboard" },
      { href: "/app/marketdata/instruments", label: "Instruments" },
      { href: "/app/marketdata/curves", label: "Curves" },
      { href: "/app/marketdata/pricing", label: "Pricing" },
    ],
  },
  {
    href: "/app/events",
    label: "Events",
    icon: History,
    subItems: [
      { href: "/app/events", label: "Dashboard" },
      { href: "/app/events/timeline", label: "Timeline" },
      { href: "/app/events/replay", label: "Replay" },
    ],
  },
];

interface AppSidebarProps {
  userEmail: string;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Exact match only for active state
  const isActive = (href: string) => {
    return pathname === href;
  };

  // Check if category should be expanded (not styled as active)
  const isCategoryExpanded = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/app" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-semibold text-sidebar-foreground">Instant</div>
            <div className="text-xs text-sidebar-foreground/60">An OS for RIAs</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navItems.map((item) => {
                const expanded = isCategoryExpanded(item);

                return (
                  <Collapsible
                    key={item.href}
                    asChild
                    defaultOpen={expanded}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={false}
                          tooltip={item.label}
                          className="[&:hover]:bg-sidebar-accent [&:hover]:text-sidebar-accent-foreground text-base"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className="block"
                              >
                                <span
                                  className={`inline-flex px-2 py-1 rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                    isActive(subItem.href)
                                      ? "bg-sidebar-active text-sidebar-active-foreground"
                                      : ""
                                  }`}
                                >
                                  {subItem.label}
                                </span>
                              </Link>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/santa-profile-pic.png" alt="Santa Claus" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                  SC
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-medium text-sidebar-foreground truncate">Santa Claus</div>
                <div className="text-xs text-sidebar-foreground/60">Advisor</div>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/60 shrink-0 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
          >
            <DropdownMenuItem onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
