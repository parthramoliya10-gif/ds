"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { AttachmentBubble } from "@/components/chat/AttachmentBubble";
import { QuotationCard } from "@/components/chat/QuotationCard";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { CreateQuotationModal } from "@/components/admin/CreateQuotationModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Message, Quotation, Request } from "@/types";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/client";
import {
  adaptRequestToFrontend,
  adaptMessageToFrontend,
  adaptQuotationToFrontend,
} from "@/lib/api/adapters";
import { SOCKET_EVENTS } from "@/lib/socket/socketClient";
import { ArrowLeft, ShieldCheck, Plus, ExternalLink, Trash2, MoreVertical, FileText, Eraser, Loader2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { cn, formatShortId } from "@/lib/utils";

export default function AdminChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) || "";

  const { socket, joinRoom, leaveRoom, sendMessage, emitTyping, markRead } = useSocket();
  const { user } = useAuth();

  const [request, setRequest] = React.useState<Request | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isPrependingOlderRef = React.useRef(false);
  const [currentQuotation, setCurrentQuotation] = React.useState<Quotation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isClearChatOpen, setIsClearChatOpen] = React.useState(false);
  const [isDeleteRequestOpen, setIsDeleteRequestOpen] = React.useState(false);

  const handleClearChat = async () => {
    if (!requestId) return;
    try {
      await api.chat.clearChat(requestId);
      setMessages([]);
      toast.success("Chat cleared for admin portal");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear chat");
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestId) return;
    try {
      await api.requests.delete(requestId);
      toast.success("Request removed from admin portal");
      router.push("/admin/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    }
  };
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isCounterpartOnline, setIsCounterpartOnline] = React.useState(false);

  const requestRef = React.useRef<Request | null>(null);
  requestRef.current = request;

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (isPrependingOlderRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (isPrependingOlderRef.current) return;
    scrollToBottom();
  }, [messages.length, isTyping]);

  const loadOlderMessages = React.useCallback(async () => {
    if (!nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    isPrependingOlderRef.current = true;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;

    try {
      const res = await api.chat.getMessages(requestId, { cursor: nextCursor });
      if (res && Array.isArray(res.messages)) {
        const olderAdapted = res.messages.map(adaptMessageToFrontend);
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = olderAdapted.filter((m: Message) => !existingIds.has(m.id));
          return [...fresh, ...prev];
        });
        setHasMoreOlder(Boolean(res.hasMore));
        setNextCursor(res.nextCursor || null);

        // Keep scroll position smooth without jumping
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
          setTimeout(() => {
            isPrependingOlderRef.current = false;
          }, 150);
        });
      } else {
        isPrependingOlderRef.current = false;
      }
    } catch (err) {
      console.warn("Failed to load older messages:", err);
      isPrependingOlderRef.current = false;
    } finally {
      setIsLoadingOlder(false);
    }
  }, [requestId, nextCursor, isLoadingOlder]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 40 && hasMoreOlder && !isLoadingOlder && nextCursor) {
      loadOlderMessages();
    }
  };

  // 1. Fetch Request Details and Messages History immediately on requestId change
  React.useEffect(() => {
    let mounted = true;

    async function initAdminChat() {
      if (!requestId) return;

      try {
        setLoading(true);

        const [reqRes, chatRes] = await Promise.allSettled([
          api.requests.getById(requestId),
          api.chat.getMessages(requestId),
        ]);

        if (mounted) {
          if (reqRes.status === "fulfilled" && reqRes.value) {
            const adapted = adaptRequestToFrontend(reqRes.value);
            setRequest(adapted);
            requestRef.current = adapted;
            if (typeof (reqRes.value as any)?.isCounterpartOnline === "boolean") {
              setIsCounterpartOnline((reqRes.value as any).isCounterpartOnline);
            }
            if (reqRes.value.quotations && reqRes.value.quotations.length > 0) {
              setCurrentQuotation(adaptQuotationToFrontend(reqRes.value.quotations[0]));
            }
          }
          if (chatRes.status === "fulfilled" && chatRes.value) {
            if (Array.isArray(chatRes.value.messages)) {
              setMessages(chatRes.value.messages.map(adaptMessageToFrontend));
            }
            setHasMoreOlder(Boolean(chatRes.value.hasMore));
            setNextCursor(chatRes.value.nextCursor || null);
            if (typeof (chatRes.value as any)?.isCounterpartOnline === "boolean") {
              setIsCounterpartOnline((chatRes.value as any).isCounterpartOnline);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch admin chat:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAdminChat();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  // 2. Real-time Socket Room & Event Listeners
  React.useEffect(() => {
    if (!requestId || !socket) return;

    // Join room and sync counterpart online status
    const syncAdminRoom = () => {
      joinRoom(requestId)
        .then((roomRes: any) => {
          if (roomRes?.success && typeof roomRes.counterpartOnline === "boolean") {
            setIsCounterpartOnline(roomRes.counterpartOnline);
          }
        })
        .catch(() => {});
    };

    syncAdminRoom();
    markRead(requestId);
    api.chat.markRead(requestId).catch(() => {});

    const handleNewMessage = (newMsg: any) => {
      if (newMsg?.requestId && newMsg.requestId !== requestId) return;
      const adapted = adaptMessageToFrontend(newMsg);
      setMessages((prev) => {
        if (prev.some((m) => m.id === adapted.id)) return prev;

        const tempIdx = prev.findIndex(
          (m) =>
            m.id.startsWith("msg_admin_") &&
            m.content.trim() === adapted.content.trim()
        );

        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = adapted;
          return next;
        }

        return [...prev, adapted];
      });
      markRead(requestId);
      api.chat.markRead(requestId).catch(() => {});
    };

    const handleStatusUpdate = (update: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === update.id
            ? { ...m, status: (update.status?.toLowerCase() || m.status) as any }
            : m
        )
      );
    };

    const handleMessagesRead = (payload: any) => {
      if (payload?.requestId === requestId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderRole === "admin" ? { ...m, status: "read" } : m
          )
        );
      }
    };

    const handleRoomJoined = (payload: any) => {
      if (payload?.requestId === requestId && typeof payload.counterpartOnline === "boolean") {
        setIsCounterpartOnline(payload.counterpartOnline);
      }
    };

    const handleUserStatusChange = (payload: any) => {
      const req = requestRef.current;
      const targetUserId = req?.studentId || (req as any)?.userId || (req as any)?.user?.id;
      if (targetUserId && payload?.userId === targetUserId) {
        setIsCounterpartOnline(payload.status === "ONLINE");
      }
    };

    const handlePeerStatus = (payload: any) => {
      if (payload?.requestId === requestId && (payload?.role === "USER" || payload?.role === "student")) {
        setIsCounterpartOnline(payload.status === "ONLINE");
      }
    };

    const handleUserTyping = (payload: any) => {
      if (payload.requestId === requestId && (payload.role === "USER" || payload.role === "student")) {
        setIsTyping(Boolean(payload.isTyping));
      }
    };

    const handleQuotationReceived = (q: any) => {
      setCurrentQuotation(adaptQuotationToFrontend(q));
    };

    const handlePaymentConfirmed = (p: any) => {
      toast.success(`Milestone payment confirmed: ${p.milestone}`);
    };

    const handleMessageDeleted = (payload: any) => {
      if (payload?.type === "for_everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  content: "This message was deleted",
                  isDeletedForEveryone: true,
                  type: "text",
                  attachment: undefined,
                  quotation: undefined,
                }
              : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    };

    socket.on(SOCKET_EVENTS.CONNECT, syncAdminRoom);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
    socket.on(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
    socket.on("room_peer_status", handlePeerStatus);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
    socket.on(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, syncAdminRoom);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
      socket.off(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
      socket.off("room_peer_status", handlePeerStatus);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
      socket.off(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      leaveRoom(requestId);
    };
  }, [requestId, socket]);

  // Handle WhatsApp-style delete message
  const handleDeleteMessage = async (messageId: string, type: "for_me" | "for_everyone") => {
    try {
      if (type === "for_me") {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted for you");
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: "This message was deleted",
                  isDeletedForEveryone: true,
                  type: "text",
                  attachment: undefined,
                  quotation: undefined,
                }
              : m
          )
        );
        toast.success("Message deleted for everyone");
      }

      await api.chat.deleteMessage(requestId, messageId, type);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete message");
    }
  };

  // Admin sending a message
  const handleSendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;

    const tempId = "msg_admin_" + Math.random().toString(36).substring(2, 9);
    const newMsg: Message = {
      id: tempId,
      requestId,
      senderId: user?.id || "usr_admin_01",
      senderRole: "admin",
      content: content || (file ? `Shared document: ${file.name}` : ""),
      timestamp: new Date().toISOString(),
      type: file ? "file" : "text",
      status: isCounterpartOnline ? "delivered" : "sent",
      attachment: file
        ? {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            url: "#",
          }
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      if (file) {
        const formData = new FormData();
        formData.append("content", content || `Shared file: ${file.name}`);
        formData.append("document", file);
        const saved = await api.chat.postMessage(requestId, formData);
        if (saved) {
          const adapted = adaptMessageToFrontend(saved);
          setMessages((prev) => {
            if (prev.some((m) => m.id === adapted.id)) {
              return prev.filter((m) => m.id !== tempId);
            }
            return prev.map((m) => (m.id === tempId ? adapted : m));
          });
        }
      } else {
        if (socket?.connected) {
          const saved = await sendMessage(requestId, content, "TEXT");
          if (saved) {
            const adapted = adaptMessageToFrontend(saved);
            setMessages((prev) => {
              if (prev.some((m) => m.id === adapted.id)) {
                return prev.filter((m) => m.id !== tempId);
              }
              return prev.map((m) => (m.id === tempId ? adapted : m));
            });
          }
        } else {
          const saved = await api.chat.postMessage(requestId, { content, messageType: "TEXT" });
          if (saved) {
            const adapted = adaptMessageToFrontend(saved);
            setMessages((prev) => {
              if (prev.some((m) => m.id === adapted.id)) {
                return prev.filter((m) => m.id !== tempId);
              }
              return prev.map((m) => (m.id === tempId ? adapted : m));
            });
          }
        }
      }
    } catch (err: any) {
      console.warn("Admin message send warning:", err);
    }
  };

  const handleCreateQuotation = (newQuotation: Quotation) => {
    setCurrentQuotation(newQuotation);
    if (request) {
      setRequest((prev) => prev ? { ...prev, status: "quoted" } : null);
    }

    const quoteMsg: Message = {
      id: "msg_quote_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: user?.id || "admin",
      senderRole: "admin",
      content: "Official quotation prepared with verified 50-50 milestone protection.",
      timestamp: new Date().toISOString(),
      type: "quotation",
      status: "sent",
      quotation: newQuotation,
    };

    setMessages((prev) => [...prev, quoteMsg]);
    toast.success(`Quotation created and posted to chat.`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background animate-pulse">
        {/* Header Skeleton */}
        <div className="p-3.5 sm:px-5 border-b border-border flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-muted rounded" />
            <div className="h-4 w-44 bg-muted/80 rounded" />
          </div>
          <div className="h-8 w-24 bg-muted/60 rounded" />
        </div>

        {/* Message Feed Skeleton */}
        <div className="flex-1 p-5 space-y-4 overflow-hidden">
          <div className="flex justify-start">
            <div className="h-14 w-64 bg-surface border border-border rounded-[8px]" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-48 bg-muted rounded-[8px]" />
          </div>
          <div className="flex justify-start">
            <div className="h-20 w-72 bg-surface border border-border rounded-[8px]" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-56 bg-muted rounded-[8px]" />
          </div>
        </div>

        {/* Composer Skeleton */}
        <div className="p-3.5 border-t border-border">
          <div className="h-10 w-full bg-muted/40 rounded-[8px]" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
        <h3 className="text-lg font-semibold">Conversation Not Found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          The requested task or conversation does not exist.
        </p>
        <Link href="/admin/chat">
          <Button variant="outline" size="sm">Back to Chat</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Admin Chat Header */}
      <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <Link
            href="/admin/chat"
            className="min-[860px]:hidden p-1.5 rounded-[6px] hover:bg-surface text-foreground"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[12px] font-semibold text-muted-foreground">
                {formatShortId(request.id, "REQ")}
              </span>
              <StatusBadge status={request.status} className="text-[10px] py-0 px-1.5 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-[14px] font-semibold text-foreground truncate leading-tight">
                {request.title}
              </h3>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center space-x-1.5 text-[12px]">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isCounterpartOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-[11px]",
                    isCounterpartOnline ? "text-emerald-500" : "text-muted-foreground"
                  )}
                >
                  {isCounterpartOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsQuotationModalOpen(true)}
            className="h-8 text-[12px] font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Issue Quotation
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border text-muted-foreground hover:text-foreground"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/admin/requests/${request.id}`} className="flex items-center w-full">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Task Details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsClearChatOpen(true)}
                className="cursor-pointer flex items-center"
              >
                <Eraser className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Clear Chat</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteRequestOpen(true)}
                className="cursor-pointer flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3"
      >
        {/* Older messages loader button / indicator */}
        {hasMoreOlder && (
          <div className="flex justify-center my-2">
            <button
              onClick={loadOlderMessages}
              disabled={isLoadingOlder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-foreground transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {isLoadingOlder ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Loading earlier conversation...</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Scroll up or click to view earlier messages</span>
                </>
              )}
            </button>
          </div>
        )}

        <DateSeparator label="Review & Communication" />

        {/* Security Notice */}
        <div className="bg-surface border border-border rounded-[8px] p-2.5 text-center max-w-md mx-auto space-y-0.5">
          <div className="flex items-center justify-center space-x-1.5 text-foreground font-semibold text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Control Session Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Student will see real-time updates and tick receipts as you send responses.
          </p>
        </div>

        {messages.length === 0 && !loading && (
          <div className="text-center py-6 px-4 rounded-[8px] bg-surface/50 border border-border/60 max-w-sm mx-auto my-4 space-y-2">
            <p className="text-[12px] font-semibold text-foreground">No messages today</p>
            <p className="text-[11px] text-muted-foreground">
              {hasMoreOlder
                ? "Earlier messages from previous days are available above."
                : "Send a message below to start communicating with the student."}
            </p>
            {hasMoreOlder && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadOlderMessages}
                disabled={isLoadingOlder}
                className="h-7 text-[11px] mt-1"
              >
                {isLoadingOlder ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    Load Earlier Messages
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === "quotation" || (msg.quotation && msg.type !== "system")) {
            const q = msg.quotation || currentQuotation;
            if (!q) return null;
            return (
              <QuotationCard
                key={msg.id}
                quotation={q}
                isAdmin
              />
            );
          }

          if (msg.type === "file" && msg.attachment) {
            return (
              <AttachmentBubble
                key={msg.id}
                attachment={msg.attachment}
                isMe={msg.senderRole === "admin" || msg.senderRole === "ADMIN"}
                onDelete={(type) => handleDeleteMessage(msg.id, type)}
              />
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderRole === "admin" || msg.senderRole === "ADMIN"}
              onDelete={handleDeleteMessage}
            />
          );
        })}

        {/* Typing indicator */}
        <TypingIndicator isVisible={isTyping} senderName="Student" />

        <div ref={messagesEndRef} />
      </div>

      {/* Admin Chat Composer */}
      <ChatComposer
        onSendMessage={handleSendMessage}
        onTypingChange={(typing) => emitTyping(requestId, typing)}
        placeholder="Type a response to the student or provide task updates..."
      />

      {/* Quotation Modal */}
      <CreateQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        requestId={request.id}
        requestTitle={request.title}
        defaultAmount={request.totalAmount || 1400}
        onSubmitQuotation={handleCreateQuotation}
      />

      <ConfirmDialog
        isOpen={isClearChatOpen}
        onClose={() => setIsClearChatOpen(false)}
        onConfirm={handleClearChat}
        title="Clear Chat for Admin Portal?"
        description="All existing messages in this chat will be cleared from the admin portal view. The student's chat record will not be affected."
        confirmLabel="Clear Chat"
        cancelLabel="Keep Messages"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isDeleteRequestOpen}
        onClose={() => setIsDeleteRequestOpen(false)}
        onConfirm={handleDeleteRequest}
        title="Delete Request from Admin Portal?"
        description="This will remove this request and chat thread from the admin portal. The student's portal record will remain unaffected."
        confirmLabel="Delete Request"
        cancelLabel="Keep Request"
        isDestructive={true}
      />
    </div>
  );
}
