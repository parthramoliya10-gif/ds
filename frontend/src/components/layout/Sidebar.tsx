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
  LogOut,
  GraduationCap,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: "student" | "admin";
}

export function Sidebar({ role = "student" }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadChatCount } = useSocket();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

  const profileHref = role === "admin" ? "/admin/profile" : "/user/profile";

  const userNavItems = [
    { label: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
    { label: "My Requests", href: "/user/requests", icon: FileText },
    { label: "Chat & Queries", href: "/user/chat", icon: MessageSquare, badge: unreadChatCount },
    { label: "My Documents", href: "/user/documents", icon: FolderDown },
    { label: "Payments", href: "/user/payments", icon: CreditCard },
    { label: "My Profile", href: "/user/profile", icon: UserIcon },
  ];

  const adminNavItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Requests", href: "/admin/requests", icon: FileCheck },
    { label: "Chat", href: "/admin/chat", icon: MessageSquare, badge: unreadChatCount },
    { label: "Documents", href: "/admin/documents", icon: UploadCloud },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Admin Profile", href: "/admin/profile", icon: UserIcon },
  ];

  const navItems = role === "admin" ? adminNavItems : userNavItems;

  return (
    <aside className="hidden min-[860px]:flex flex-col w-64 border-r border-border bg-background h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href={role === "admin" ? "/admin/dashboard" : "/user/dashboard"} className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-[8px] bg-foreground text-background flex items-center justify-center font-bold text-[14px]">
            D
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[16px] tracking-tight text-foreground leading-none">
              DSMS
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              {role === "admin" ? "Admin Portal" : "Student Desk"}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/user/dashboard" &&
              item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors group",
                // Active = filled black (light mode) / filled white (dark mode)
                isActive
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 min-w-[20px] h-5 rounded-full flex items-center justify-center shrink-0 leading-none",
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-foreground text-background"
                  )}
                >
                  {item.badge! > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Profile Card & Logout */}
      <div className="p-4 border-t border-border bg-surface/50">
        <Link
          href={profileHref}
          className="flex items-center space-x-3 mb-3 p-1.5 -m-1.5 rounded-[8px] hover:bg-surface transition-colors group"
          title="Manage Profile & Credentials"
        >
          <Avatar className="h-10 w-10 border border-border group-hover:border-foreground/50 transition-colors">
            <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || (role === "admin" ? "AD" : "ST")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground truncate leading-tight group-hover:underline">
              {user?.name || (role === "admin" ? "Admin" : "Student")}
            </p>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 h-4 border-border font-medium"
              >
                {role === "admin" ? "Admin" : "Student"}
              </Badge>
            </div>
          </div>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full justify-center text-[12px] h-8 border-border text-foreground hover:bg-surface"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign out
        </Button>

        <ConfirmDialog
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={logout}
          title="Sign out of DSMS?"
          description="Are you sure you want to end your current session? You will be redirected to the login screen."
          confirmLabel="Sign out"
          cancelLabel="Stay logged in"
          isDestructive={true}
        />
      </div>
    </aside>
  );
}
