"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck, Check, Trash2, X } from "lucide-react";
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

const getInitialNotifications = (r: "student" | "admin"): Notification[] => {
  if (r === "admin") {
    return [
      {
        id: "notif-1",
        userId: "admin",
        title: "New Request Submitted",
        message: "Student Aarav submitted REQ-1003 (DBMS Assignment). Review and dispatch quotation.",
        read: false,
        createdAt: "10 mins ago",
        link: "/admin/requests",
      },
      {
        id: "notif-2",
        userId: "admin",
        title: "Advance Payment Verified",
        message: "Received $450 milestone advance for REQ-1001 (TXN-9F2B14).",
        read: false,
        createdAt: "45 mins ago",
        link: "/admin/payments",
      },
      {
        id: "notif-3",
        userId: "admin",
        title: "Revision Requested",
        message: "Student requested minor diagram updates on REQ-1002.",
        read: false,
        createdAt: "2 hours ago",
        link: "/admin/documents",
      },
    ];
  }
  return [
    {
      id: "notif-1",
      userId: "student",
      title: "Milestone Quotation Ready",
      message: "Admin issued quotation QT-8A2F for request REQ-1003. $450 advance required to begin.",
      read: false,
      createdAt: "15 mins ago",
      link: "/user/requests",
    },
    {
      id: "notif-2",
      userId: "student",
      title: "Deliverable Uploaded",
      message: "Final deliverable v1.0 uploaded for REQ-1002. Complete milestone payment to unlock download.",
      read: false,
      createdAt: "1 hour ago",
      link: "/user/documents",
    },
    {
      id: "notif-3",
      userId: "student",
      title: "Specialist Message",
      message: "Academic specialist posted instructions regarding experiment 4 formatting.",
      read: false,
      createdAt: "3 hours ago",
      link: "/user/chat",
    },
  ];
};

export function Topbar({ title, role = "student" }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const storageKey = `dsms_notifications_${role}`;
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        const initial = getInitialNotifications(role);
        setNotifications(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch {
      setNotifications(getInitialNotifications(role));
    }
  }, [role, storageKey]);

  const updateNotifications = (newList: Notification[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch (e) {
      console.warn("Could not save notifications to localStorage:", e);
    }
  };

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
    const updated = notifications.map((n) => ({ ...n, read: true }));
    updateNotifications(updated);
  };

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    updateNotifications(updated);
  };

  const clearNotification = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const updated = notifications.filter((n) => n.id !== id);
    updateNotifications(updated);
  };

  const clearAll = () => {
    updateNotifications([]);
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
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center border-2 border-background animate-in fade-in zoom-in">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-88 sm:w-96 p-0 border border-border bg-background rounded-[8px] shadow-lg"
          >
            <div className="flex items-center justify-between p-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground font-mono font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center px-1.5 py-1 rounded hover:bg-surface transition-colors font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Read all
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-muted-foreground hover:text-destructive flex items-center px-1.5 py-1 rounded hover:bg-surface transition-colors font-medium"
                    title="Clear all notifications"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 stroke-[1.5]" />
                  <p className="text-[13px] font-medium text-foreground">No notifications</p>
                  <p className="text-[11px] text-muted-foreground">You are all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "group relative p-3 text-[12px] transition-colors hover:bg-surface flex items-start justify-between gap-2",
                      !notif.read && "bg-surface/50"
                    )}
                  >
                    <Link
                      href={notif.link || "#"}
                      onClick={() => markAsRead(notif.id)}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-foreground shrink-0" />
                        )}
                        <span className={cn("text-[13px] text-foreground truncate", !notif.read ? "font-bold" : "font-semibold")}>
                          {notif.title}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[12px]">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">
                        {notif.createdAt}
                      </span>
                    </Link>

                    {/* Individual Read & Clear Action Icons */}
                    <div className="flex items-center space-x-0.5 shrink-0 pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={(e) => markAsRead(notif.id, e)}
                          className="h-7 w-7 rounded-[6px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => clearNotification(notif.id, e)}
                        className="h-7 w-7 rounded-[6px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear notification"
                        aria-label="Clear notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
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
