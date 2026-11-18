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

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Join room and fetch history from backend
  React.useEffect(() => {
    let mounted = true;

    async function initAdminChat() {
      if (!requestId) return;

      try {
        setLoading(true);
        await joinRoom(requestId);
        markRead(requestId);

        const [reqRes, chatRes] = await Promise.allSettled([
          api.requests.getById(requestId),
          api.chat.getMessages(requestId),
        ]);

        if (mounted) {
          if (reqRes.status === "fulfilled" && reqRes.value) {
            setRequest(adaptRequestToFrontend(reqRes.value));
            if (reqRes.value.quotations && reqRes.value.quotations.length > 0) {
              setCurrentQuotation(adaptQuotationToFrontend(reqRes.value.quotations[0]));
            }
          }
          if (chatRes.status === "fulfilled" && Array.isArray(chatRes.value?.messages)) {
            setMessages(chatRes.value.messages.map(adaptMessageToFrontend));
          }
        }
      } catch (err) {
        console.warn("Could not fetch admin chat:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAdminChat();

    // Socket Event Listeners
    if (socket) {
      const handleNewMessage = (newMsg: any) => {
        const adapted = adaptMessageToFrontend(newMsg);
        setMessages((prev) => {
          if (prev.some((m) => m.id === adapted.id)) return prev;
          return [...prev, adapted];
        });
        markRead(requestId);
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

      socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
      socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.on(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
      socket.on(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);

      return () => {
        socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
        socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
        socket.off(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
        socket.off(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);
        leaveRoom(requestId);
        mounted = false;
      };
    }

    return () => {
      leaveRoom(requestId);
      mounted = false;
    };
  }, [requestId, socket, joinRoom, leaveRoom, markRead]);

  // Admin sending a message
  const handleSendMessage = async (content: string, file?: File) => {
    const tempId = "msg_admin_" + Math.random().toString(36).substring(2, 9);
    const newMsg: Message = {
      id: tempId,
      requestId,
      senderId: user?.id || "usr_admin_01",
      senderRole: "admin",
      content: content || (file ? `Shared document: ${file.name}` : ""),
      timestamp: new Date().toISOString(),
      type: file ? "file" : "text",
      status: "sent",
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
          setMessages((prev) => prev.map((m) => (m.id === tempId ? adapted : m)));
        }
      } else {
        if (socket?.connected) {
          await sendMessage(requestId, content, "TEXT");
        } else {
          await api.chat.postMessage(requestId, { content, messageType: "TEXT" });
        }
      }
    } catch (err: any) {
      console.warn("Admin message send warning:", err);
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "delivered" } : m))
        );
      }, 600);
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
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="text-[14px] text-muted-foreground">Loading conversation...</p>
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
                {request.id}
              </span>
              <StatusBadge status={request.status} className="text-[10px] py-0 px-1.5 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground truncate leading-tight">
              {request.title}
            </h3>
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
              />
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderRole === "admin" || msg.senderRole === "ADMIN"}
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
