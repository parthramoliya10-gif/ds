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
import { ArrowLeft, ShieldCheck, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) || "";

  const { socket, joinRoom, leaveRoom, sendMessage, emitTyping, markRead } = useSocket();
  const { user } = useAuth();

  const [request, setRequest] = React.useState<Request | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [currentQuotation, setCurrentQuotation] = React.useState<Quotation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isCounterpartOnline, setIsCounterpartOnline] = React.useState(false);

  const requestRef = React.useRef<Request | null>(null);
  requestRef.current = request;

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
                {request.id.slice(0, 8)}...
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
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsQuotationModalOpen(true)}
            className="h-8 text-[12px] font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Issue Quotation
          </Button>

          <Link href={`/admin/requests/${request.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
              Task Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        <DateSeparator label="Student Inquiry & Specification Review" />

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
    </div>
  );
}
