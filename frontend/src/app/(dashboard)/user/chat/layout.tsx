"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime } from "@/lib/utils";
import { Search, MessageSquare } from "lucide-react";

export default function UserChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const activeRequestId = params?.requestId as string | undefined;
  const [search, setSearch] = React.useState("");
  const [requests, setRequests] = React.useState<Request[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function loadList() {
      try {
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          setRequests(res.requests.map(adaptRequestToFrontend));
        }
      } catch (err) {
        console.warn("Could not load chat requests:", err);
      }
    }
    loadList();
    return () => {
      mounted = false;
    };
  }, []);

  // Determine if active detail view is shown
  const isDetailView = Boolean(activeRequestId);

  const filteredRequests = requests.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-[8px] border border-border bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "w-full min-[860px]:w-80 lg:w-96 border-r border-border flex flex-col bg-background shrink-0",
          isDetailView && "hidden min-[860px]:flex"
        )}
      >
        {/* Header & Search */}
        <div className="p-3.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
              Task Chats
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              {filteredRequests.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-8 h-9 text-[13px] bg-background border-border"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredRequests.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              No task chats found matching &apos;{search}&apos;
            </div>
          ) : (
            filteredRequests.map((req, idx) => {
              const isActive = activeRequestId === req.id;

              return (
                <Link
                  key={req.id}
                  href={`/user/chat/${req.id}`}
                  className={cn(
                    "flex flex-col p-3.5 transition-colors hover:bg-surface text-left relative",
                    isActive
                      ? "bg-surface border-l-2 border-foreground"
                      : "bg-background"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0 bg-foreground" />
                      <span className="text-[12px] font-mono font-medium text-muted-foreground">
                        {req.id.substring(0, 8)}...
                      </span>
                    </div>

                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-[14px] font-semibold text-foreground line-clamp-1 mb-1 leading-snug">
                    {req.title}
                  </h4>

                  <div className="flex items-center justify-between text-[12px]">
                    <p className="text-muted-foreground truncate max-w-[200px]">
                      {req.description || "Task discussion"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Thread Panel */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-surface/20 min-w-0 h-full",
          !isDetailView && "hidden min-[860px]:flex"
        )}
      >
        {children}
      </div>
    </div>
  );
}
