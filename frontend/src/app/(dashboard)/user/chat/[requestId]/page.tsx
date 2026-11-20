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
import { RazorpayModal } from "@/components/payments/RazorpayModal";
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
import { ArrowLeft, MoreVertical, ShieldCheck, CheckCircle2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UserChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  const { socket, joinRoom, leaveRoom, sendMessage, emitTyping, markRead } = useSocket();
  const { user } = useAuth();

  const [request, setRequest] = React.useState<Request | null>(null);
  const [currentQuotation, setCurrentQuotation] = React.useState<Quotation | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isCounterpartOnline, setIsCounterpartOnline] = React.useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState(false);
  const [changeReason, setChangeReason] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [isClearChatOpen, setIsClearChatOpen] = React.useState(false);
  const [isDeleteRequestOpen, setIsDeleteRequestOpen] = React.useState(false);

  const handleClearChat = async () => {
    if (!requestId) return;
    try {
      await api.chat.clearChat(requestId);
      setMessages([]);
      toast.success("Chat cleared for your account");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear chat");
    }
  };

  const handleDeleteRequest = async () => {
    if (!requestId) return;
    try {
      await api.requests.delete(requestId);
      toast.success("Request removed from your account");
      router.push("/user/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    }
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 1. Fetch Request & Message History immediately when requestId changes
  React.useEffect(() => {
    let mounted = true;

    async function initChat() {
      if (!requestId) return;

      try {
        setLoading(true);

        const [reqRes, chatRes] = await Promise.allSettled([
          api.requests.getById(requestId),
          api.chat.getMessages(requestId),
        ]);

        if (mounted) {
          if (reqRes.status === "fulfilled" && reqRes.value) {
            setRequest(adaptRequestToFrontend(reqRes.value));
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
        console.warn("Could not load chat data:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initChat();

    return () => {
      mounted = false;
    };
  }, [requestId]);

  // 2. Real-time Socket Room & Listeners
  React.useEffect(() => {
    if (!requestId || !socket) return;

    // Join room and sync counterpart online status
    const syncRoom = () => {
      joinRoom(requestId)
        .then((roomRes: any) => {
          if (roomRes?.success && typeof roomRes.counterpartOnline === "boolean") {
            setIsCounterpartOnline(roomRes.counterpartOnline);
          }
        })
        .catch(() => {});
    };

    syncRoom();
    markRead(requestId);
    api.chat.markRead(requestId).catch(() => {});

    const handleNewMessage = (newMsg: any) => {
      if (newMsg?.requestId && newMsg.requestId !== requestId) return;
      const adapted = adaptMessageToFrontend(newMsg);
      setMessages((prev) => {
        if (prev.some((m) => m.id === adapted.id)) return prev;

        const tempIdx = prev.findIndex(
          (m) =>
            m.id.startsWith("msg_temp_") &&
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
            m.senderRole === "student" ? { ...m, status: "read" } : m
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
      if (payload?.role === "ADMIN" || payload?.role === "admin") {
        if (typeof payload.anyAdminOnline === "boolean") {
          setIsCounterpartOnline(payload.anyAdminOnline);
        } else {
          setIsCounterpartOnline(payload.status === "ONLINE");
        }
      }
    };

    const handlePeerStatus = (payload: any) => {
      if (payload?.requestId === requestId && (payload?.role === "ADMIN" || payload?.role === "admin")) {
        setIsCounterpartOnline(payload.status === "ONLINE");
      }
    };

    const handleUserTyping = (payload: any) => {
      if (payload.requestId === requestId && payload.role === "ADMIN") {
        setIsTyping(Boolean(payload.isTyping));
      }
    };

    const handleQuotationReceived = (q: any) => {
      const adapted = adaptQuotationToFrontend(q);
      setCurrentQuotation(adapted);
      toast.info("New quotation received from admin!");
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

    socket.on(SOCKET_EVENTS.CONNECT, syncRoom);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
    socket.on(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
    socket.on("room_peer_status", handlePeerStatus);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, syncRoom);
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
      socket.off(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
      socket.off("room_peer_status", handlePeerStatus);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
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

  // Handle student sending a new message
  const handleSendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;

    // Optimistic message
    const tempId = "msg_temp_" + Math.random().toString(36).substring(2, 9);
    const newMsg: Message = {
      id: tempId,
      requestId,
      senderId: user?.id || "student_user",
      senderRole: "student",
      content: content || (file ? `Uploaded reference file: ${file.name}` : ""),
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
        // Send via multipart REST
        const formData = new FormData();
        formData.append("content", content || `Uploaded reference file: ${file.name}`);
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
        // Send via real-time WebSocket
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
      console.warn("Message sending fallback:", err);
    }
  };

  // Handle "Accept & Pay Advance"
  const handleAcceptAndPay = async (q: Quotation) => {
    try {
      if (q.id && !q.id.startsWith("QT-")) {
        await api.quotations.accept(q.id);
      }
    } catch (err: any) {
      console.warn("Quotation accept api warning:", err);
    }
    setIsRazorpayOpen(true);
  };

  const handleRazorpaySuccess = ({ transactionId }: { transactionId: string }) => {
    // Update quotation status
    setCurrentQuotation((prev) =>
      prev
        ? {
            ...prev,
            status: "accepted",
          }
        : null
    );

    setRequest((prev) =>
      prev
        ? {
            ...prev,
            advancePaid: true,
            status: "in_progress",
          }
        : null
    );

    // Add confirmation message into chat
    const confirmMsg: Message = {
      id: "msg_conf_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: "system",
      senderRole: "system",
      content: `50% Advance Milestone payment of $${currentQuotation?.advanceAmount || 0} verified (Ref: ${transactionId}). Work has officially commenced!`,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "read",
    };

    setMessages((prev) => [...prev, confirmMsg]);
    toast.success("Advance paid! Specialist has started work on your assignment.");
  };

  const handleRequestChange = (q: Quotation) => {
    setChangeReason("");
    setIsChangeModalOpen(true);
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
          <div className="h-8 w-20 bg-muted/60 rounded" />
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
            <div className="h-24 w-80 bg-surface border border-border rounded-[8px]" />
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
        <h3 className="text-[16px] font-semibold text-foreground">Conversation Not Found</h3>
        <p className="text-[13px] text-muted-foreground">This task request does not exist or has been removed.</p>
        <Link href="/user/chat">
          <Button variant="outline" size="sm">Back to task chats</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <Link
            href="/user/chat"
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

        <div className="flex items-center space-x-1.5 shrink-0">
          <Link href={`/user/requests/${request.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
              Task Details
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearChatOpen(true)}
            className="h-8 text-[12px] border-border text-muted-foreground hover:text-foreground"
            title="Clear chat messages for my account"
          >
            Clear Chat
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleteRequestOpen(true)}
            className="h-8 w-8 border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
            title="Delete this task request from my account"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        <DateSeparator label="Initial Consultation & Milestone Agreement" />

        {/* Security & Milestone Escrow Notice */}
        <div className="bg-surface border border-border rounded-[8px] p-3 text-center max-w-md mx-auto space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-foreground font-semibold text-[12px]">
            <ShieldCheck className="h-4 w-4" />
            <span>50-50 Milestone Protection Enabled</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your 50% advance milestone is safeguarded. The specialist only receives the remaining 50% once your final completed deliverable is verified.
          </p>
        </div>

        {/* Message stream */}
        {messages.map((msg) => {
          if (msg.type === "quotation" || (msg.quotation && msg.type !== "system")) {
            const quot = msg.quotation || currentQuotation;
            if (!quot) return null;
            return (
              <QuotationCard
                key={msg.id}
                quotation={quot}
                onAcceptAndPay={handleAcceptAndPay}
                onRequestChange={handleRequestChange}
              />
            );
          }

          if (msg.type === "file" && msg.attachment) {
            return (
              <AttachmentBubble
                key={msg.id}
                attachment={msg.attachment}
                isMe={msg.senderRole === "student" || msg.senderRole === "USER"}
                onDelete={(type) => handleDeleteMessage(msg.id, type)}
              />
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderRole === "student" || msg.senderRole === "USER"}
              onDelete={handleDeleteMessage}
            />
          );
        })}

        {/* Real-time typing indicator */}
        <TypingIndicator isVisible={isTyping} senderName="Admin Specialist" />

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-Style Chat Composer */}
      <ChatComposer
        onSendMessage={handleSendMessage}
        onTypingChange={(typing) => emitTyping(requestId, typing)}
        disabled={request.status === "completed" || request.status === "cancelled"}
        placeholder="Type a message or clarify assignment specifications..."
      />

      {/* Razorpay 50% Advance Checkout Modal */}
      {currentQuotation && (
        <RazorpayModal
          isOpen={isRazorpayOpen}
          onClose={() => setIsRazorpayOpen(false)}
          amount={currentQuotation.advanceAmount}
          title={`50% Advance Milestone: ${request.title}`}
          milestoneType="advance"
          requestId={request.id}
          quotationId={currentQuotation.id}
          onSuccess={handleRazorpaySuccess}
        />
      )}

      {/* Custom Request Change Dialog */}
      <Dialog open={isChangeModalOpen} onOpenChange={setIsChangeModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border rounded-[10px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold text-foreground">
              Request Changes & Revisions
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed">
              Describe any adjustments, specific instructions, or requirements you would like the specialist to consider (e.g. topic details, deadline, formatting, or pricing).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <textarea
              rows={4}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Type your instructions, guidelines, deadline preferences, or any specific changes you would like to discuss..."
              className="w-full rounded-[8px] border border-border bg-surface p-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
              autoFocus
            />
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsChangeModalOpen(false);
                setChangeReason("");
              }}
              className="text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!changeReason.trim()}
              onClick={() => {
                if (!changeReason.trim()) return;
                handleSendMessage(changeReason.trim());
                setIsChangeModalOpen(false);
                setChangeReason("");
                toast.success("Change request sent in chat!");
              }}
              className="text-[13px] font-medium"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isClearChatOpen}
        onClose={() => setIsClearChatOpen(false)}
        onConfirm={handleClearChat}
        title="Clear Chat for Your Account?"
        description="All existing messages in this chat will be cleared from your view. The specialist desk record will not be affected."
        confirmLabel="Clear Chat"
        cancelLabel="Keep Messages"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isDeleteRequestOpen}
        onClose={() => setIsDeleteRequestOpen(false)}
        onConfirm={handleDeleteRequest}
        title="Delete Request from Your Account?"
        description="This will remove this request and chat thread from your account. The specialist desk record will remain unaffected."
        confirmLabel="Delete Request"
        cancelLabel="Keep Request"
        isDestructive={true}
      />
    </div>
  );
}
