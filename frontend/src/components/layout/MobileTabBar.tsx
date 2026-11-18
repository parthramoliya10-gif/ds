"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  FolderDown,
  CreditCard,
  FileCheck,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabBarProps {
  role?: "student" | "admin";
}

export function MobileTabBar({ role = "student" }: MobileTabBarProps) {
  const pathname = usePathname();

  const userTabs = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "Requests", href: "/user/requests", icon: FileText },
    { label: "Chat", href: "/user/chat", icon: MessageSquare },
    { label: "Files", href: "/user/documents", icon: FolderDown },
    { label: "Pay", href: "/user/payments", icon: CreditCard },
  ];

  const adminTabs = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Requests", href: "/admin/requests", icon: FileCheck },
    { label: "Chat", href: "/admin/chat", icon: MessageSquare },
    { label: "Uploads", href: "/admin/documents", icon: UploadCloud },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
  ];

  const tabs = role === "admin" ? adminTabs : userTabs;

  // Hide mobile tab bar inside active chat rooms to let the chat composer take 100% of mobile screen
  const isChatRoom =
    (pathname.startsWith("/user/chat/") && pathname !== "/user/chat") ||
    (pathname.startsWith("/admin/chat/") && pathname !== "/admin/chat");

  if (isChatRoom) return null;

  return (
    <nav className="min-[860px]:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-2 py-1 flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/user/dashboard" &&
            tab.href !== "/admin/dashboard" &&
            pathname.startsWith(tab.href));
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center min-h-[48px] min-w-[52px] px-1 py-1 rounded-[6px] transition-colors",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-[6px] transition-colors",
                isActive && "bg-surface border border-border"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
