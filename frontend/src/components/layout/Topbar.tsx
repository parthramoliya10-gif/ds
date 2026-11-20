"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopbarProps {
  title?: string;
  role?: "student" | "admin";
}

export function Topbar({ title, role = "student" }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Compute a smart page title if not explicitly provided
  const derivedTitle = React.useMemo(() => {
    if (title) return title;
    if (pathname.includes("/profile")) return role === "admin" ? "Admin Profile" : "My Profile & Settings";
    if (pathname.includes("/dashboard")) return "Dashboard";
    if (pathname.includes("/requests/new")) return "Create New Request";
    if (pathname.includes("/requests/")) return "Request Details";
    if (pathname.includes("/requests")) return "My Requests";
    if (pathname.includes("/chat/")) return "Live Discussion";
    if (pathname.includes("/chat")) return "Chat & Queries";
    if (pathname.includes("/documents")) return "My Documents";
    if (pathname.includes("/payments")) return "Payments & Milestones";
    return "DSMS";
  }, [pathname, title, role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Page Title & Breadcrumb Context */}
      <div className="flex items-center space-x-2">
        <span className="text-[12px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
          {role === "admin" ? "Admin" : "Student Desk"}
        </span>
        <span className="text-muted-foreground/40 hidden sm:inline">/</span>
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
          {derivedTitle}
        </h2>
      </div>

      {/* Right Actions: Notifications + ThemeToggle */}
      <div className="flex items-center space-x-2.5">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-9 w-9 rounded-[8px] border-border text-foreground hover:bg-surface"
              aria-label="Open notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center border border-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 border border-border bg-background rounded-[8px]"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-[14px] font-semibold text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[12px] text-muted-foreground hover:text-foreground flex items-center space-x-1"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-[12px] text-muted-foreground">
                  No notifications
                </p>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link || "#"}
                    className={cn(
                      "block p-3 text-[12px] transition-colors hover:bg-surface",
                      !notif.read && "bg-surface/50 font-medium"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Avatar Button */}
        <Link
          href={role === "admin" ? "/admin/profile" : "/user/profile"}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-foreground"
          title="Manage Profile & Credentials"
        >
          <Avatar className="h-9 w-9 border border-border hover:border-foreground transition-colors">
            <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
            <AvatarFallback className="text-[12px] font-bold bg-foreground text-background">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || (role === "admin" ? "AD" : "ST")}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
