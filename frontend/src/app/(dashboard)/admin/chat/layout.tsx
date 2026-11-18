"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const activeRequestId = params?.requestId as string | undefined;
  const [search, setSearch] = React.useState("");
  const [requests, setRequests] = React.useState<Request[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function loadAdminChatList() {
      try {
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          setRequests(res.requests.map(adaptRequestToFrontend));
        }
      } catch (err) {
        console.warn("Could not load admin chat list:", err);
      }
    }
    loadAdminChatList();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRequests = requests.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.studentName && r.studentName.toLowerCase().includes(search.toLowerCase()))
  );

  const isDetailView = Boolean(activeRequestId);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-[8px] border border-border bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "w-full sm:w-80 md:w-96 border-r border-border flex flex-col bg-background shrink-0",
          isDetailView && "hidden sm:flex"
        )}
      >
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or task..."
              className="pl-8 h-9 text-[13px] bg-background border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredRequests.length === 0 ? (
            <div className="p-4 text-center text-[13px] text-muted-foreground">
              No active conversations
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isActive = activeRequestId === req.id;
              return (
                <Link
                  key={req.id}
                  href={`/admin/chat/${req.id}`}
                  className={cn(
                    "flex flex-col p-3 transition-colors hover:bg-surface text-left",
                    isActive ? "bg-surface border-l-2 border-foreground" : "bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-mono font-medium text-muted-foreground">
                      {req.id} • {req.studentName}
                    </span>
                    <StatusBadge status={req.status} className="text-[10px] py-0 px-1.5 h-4" />
                  </div>
                  <h4 className="text-[14px] font-semibold text-foreground line-clamp-1 mb-1">
                    {req.title}
                  </h4>
                  <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>{req.college}</span>
                    <span>{req.pages} pages</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-surface/30 min-w-0",
          !isDetailView && "hidden sm:flex"
        )}
      >
        {children}
      </div>
    </div>
  );
}
