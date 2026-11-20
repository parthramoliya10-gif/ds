"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/context/SocketContext";
import { SOCKET_EVENTS } from "@/lib/socket/socketClient";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

function formatChatTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function AdminChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const activeRequestId = params?.requestId as string | undefined;
  const [search, setSearch] = React.useState("");
  const [requests, setRequests] = React.useState<Request[]>([]);
  const { socket, refreshUnreadCount } = useSocket();
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  const confirmDeleteChat = async () => {
    if (!deleteTargetId) return;
    try {
      await api.requests.delete(deleteTargetId);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTargetId));
      refreshUnreadCount();
      toast.success("Chat removed from admin portal");
      if (activeRequestId === deleteTargetId) {
        router.push("/admin/chat");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete chat");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Load chat requests on mount
  React.useEffect(() => {
    let mounted = true;
    async function loadAdminChatList() {
      try {
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          const adapted = res.requests.map(adaptRequestToFrontend).map((r: Request) =>
            r.id === activeRequestId ? { ...r, unreadCount: 0 } : r
          );
          setRequests(adapted);
        }
      } catch (err) {
        console.warn("Could not load admin chat list:", err);
      }
    }
    loadAdminChatList();
    return () => {
      mounted = false;
    };
  }, [activeRequestId]);

  // When activeRequestId changes / chat is opened, clear unreadCount for that chat and sync badge
  React.useEffect(() => {
    if (!activeRequestId) return;
    setRequests((prev) =>
      prev.map((req) =>
        req.id === activeRequestId ? { ...req, unreadCount: 0 } : req
      )
    );
    refreshUnreadCount();
  }, [activeRequestId, refreshUnreadCount]);

  // Real-time socket updates for new messages & read receipts
  React.useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: any) => {
      const targetReqId = newMsg.requestId || newMsg.conversation?.requestId;
      if (!targetReqId) return;

      const isFromCounterpart =
        newMsg.senderRole === "USER" ||
        newMsg.sender?.role?.toUpperCase() === "USER";

      setRequests((prev) => {
        const index = prev.findIndex((r) => r.id === targetReqId);
        if (index === -1) {
          api.requests.list({ limit: 50 }).then((res) => {
            if (res && Array.isArray(res.requests)) {
              setRequests(
                res.requests.map(adaptRequestToFrontend).map((r: Request) =>
                  r.id === activeRequestId ? { ...r, unreadCount: 0 } : r
                )
              );
            }
          }).catch(() => {});
          return prev;
        }

        const currentReq = prev[index];
        const isActiveChat = activeRequestId === targetReqId;

        // Only increment unread count if message came from user/student AND chat is not currently open
        const newUnreadCount = isActiveChat || !isFromCounterpart
          ? (isActiveChat ? 0 : (currentReq.unreadCount || 0))
          : (currentReq.unreadCount || 0) + 1;

        const updatedReq: Request = {
          ...currentReq,
          unreadCount: newUnreadCount,
          lastMessage: {
            content: newMsg.content,
            createdAt: newMsg.createdAt || new Date().toISOString(),
            senderRole: newMsg.senderRole || newMsg.sender?.role,
          },
        };

        // WhatsApp style: Move updated conversation to top of the list
        const nextList = [...prev];
        nextList.splice(index, 1);
        return [updatedReq, ...nextList];
      });
    };

    const handleMessagesRead = (data: { requestId: string }) => {
      if (!data?.requestId) return;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === data.requestId ? { ...r, unreadCount: 0 } : r
        )
      );
    };

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
    };
  }, [socket, activeRequestId]);

  const filteredRequests = requests.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.studentName && r.studentName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUnread = requests.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  const isDetailView = Boolean(activeRequestId);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-[8px] border border-border bg-background overflow-hidden">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "w-full min-[860px]:w-80 md:w-96 border-r border-border flex flex-col bg-background shrink-0",
          isDetailView && "hidden min-[860px]:flex"
        )}
      >
        <div className="p-3.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
              Admin Discussions
            </h3>
            <div className="flex items-center space-x-1.5">
              {totalUnread > 0 && (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {totalUnread} new
                </span>
              )}
              <span className="text-[11px] text-muted-foreground font-mono">
                {filteredRequests.length} Active
              </span>
            </div>
          </div>

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
              const hasUnread = (req.unreadCount || 0) > 0;
              const messageTime = req.lastMessage?.createdAt
                ? formatChatTime(req.lastMessage.createdAt)
                : formatChatTime(req.createdAt);
              const snippet = req.lastMessage?.content || req.college || "Task discussion";

              return (
                <Link
                  key={req.id}
                  href={`/admin/chat/${req.id}`}
                  className={cn(
                    "flex flex-col p-3.5 transition-colors hover:bg-surface text-left relative group",
                    isActive ? "bg-surface border-l-2 border-foreground" : "bg-transparent"
                  )}
                >
                  {/* Top Line: ID & Student on Left | Status FIRST, Time in far right CORNER */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 truncate mr-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          hasUnread ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="text-[12px] font-mono font-medium text-muted-foreground truncate max-w-[160px]">
                        {req.id.substring(0, 8)}... • {req.studentName || "Student"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Status FIRST */}
                      <StatusBadge status={req.status} className="text-[10px] py-0 px-1.5 h-4" />

                      {/* Time in the far CORNER */}
                      {messageTime && (
                        <span
                          className={cn(
                            "text-[11px] font-mono",
                            hasUnread
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-muted-foreground"
                          )}
                        >
                          {messageTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4
                    className={cn(
                      "text-[14px] line-clamp-1 mb-1 leading-snug",
                      hasUnread
                        ? "font-bold text-foreground"
                        : "font-semibold text-foreground"
                    )}
                  >
                    {req.title}
                  </h4>

                  {/* Bottom Line: Snippet on Left | Page count and WhatsApp green badge on Right */}
                  <div className="flex items-center justify-between text-[12px]">
                    <p
                      className={cn(
                        "truncate max-w-[200px]",
                        hasUnread
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {snippet}
                    </p>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {hasUnread && (
                        <span className="bg-emerald-500 text-white rounded-full text-[11px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 shadow-sm animate-in zoom-in-50 duration-200">
                          {req.unreadCount! > 99 ? "99+" : req.unreadCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTargetId(req.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500"
                        title="Delete chat from admin portal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
          !isDetailView && "hidden min-[860px]:flex"
        )}
      >
        {children}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteChat}
        title="Delete Chat from Admin Portal?"
        description="This will remove this conversation from your chat list. The student portal record will not be affected."
        confirmLabel="Delete Chat"
        cancelLabel="Keep Chat"
        isDestructive={true}
      />
    </div>
  );
}
