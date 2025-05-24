
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import {
  LayoutGrid, // Changed from LayoutDashboard
  ListChecks, // Changed from ClipboardList
  CalendarDays, // New
  LineChart, // Changed from Lightbulb (Analytics)
  Users, // New
  PlugZap, // Kept for Integrations
  Settings, // For settings section
  HelpCircle, // For help section
  LogOut, // For logout section
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // "Menu" section
  const mainNavItems = [
    { href: "/", labelKey: "nav.dashboard", icon: LayoutGrid },
    { href: "/scraping-tasks", labelKey: "nav.tasks", icon: ListChecks }, // Assuming scraping tasks are "Tasks"
    { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays }, // New
    { href: "/analytics", labelKey: "nav.analytics", icon: LineChart }, // New
    { href: "/team", labelKey: "nav.team", icon: Users }, // New
    // Retaining AI Insights and Integrations if they are still relevant or can be mapped
    { href: "/ai-insights", labelKey: "nav.aiInsights", icon: LineChart }, // Could also be a brain icon
    { href: "/integrations", labelKey: "nav.integrations", icon: PlugZap },
  ];
  
  // "General" section items are now directly in app-layout.tsx for simplicity with current structure

  return (
    <>
      {mainNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            className={cn(
              "w-full justify-start gap-3 text-sm font-normal text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
              pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground font-medium relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-primary before:rounded-r-md"
            )}
            tooltip={{ children: t(item.labelKey), className: "ml-2"}}
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
