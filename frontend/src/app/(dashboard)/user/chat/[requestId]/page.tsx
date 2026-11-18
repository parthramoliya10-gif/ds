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
import { ArrowLeft, MoreVertical, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

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

    async function initChat() {
      if (!requestId) return;

      // 1. Join Socket Room
      await joinRoom(requestId);
      markRead(requestId);

      // 2. Fetch Request & Quotation Details
      try {
        const reqData = await api.requests.getById(requestId);
        if (mounted && reqData) {
          setRequest(adaptRequestToFrontend(reqData));
          if (reqData.quotations && reqData.quotations.length > 0) {
            setCurrentQuotation(adaptQuotationToFrontend(reqData.quotations[0]));
          }
        }
      } catch (err) {
        console.warn("Could not fetch request details:", err);
      }

      // 3. Fetch Message History
      try {
        const chatRes = await api.chat.getMessages(requestId);
        if (mounted && chatRes && chatRes.messages && chatRes.messages.length > 0) {
          const adapted = chatRes.messages.map(adaptMessageToFrontend);
          setMessages(adapted);
        }
      } catch (err) {
        console.warn("Could not fetch message history:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initChat();

    // Socket Event Listeners
    if (socket) {
      const handleNewMessage = (newMsg: any) => {
        const adapted = adaptMessageToFrontend(newMsg);
        setMessages((prev) => {
          // Prevent duplicates
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
        if (payload.requestId === requestId && payload.role === "ADMIN") {
          setIsTyping(Boolean(payload.isTyping));
        }
      };

      const handleQuotationReceived = (q: any) => {
        const adapted = adaptQuotationToFrontend(q);
        setCurrentQuotation(adapted);
        toast.info("New quotation received from admin!");
      };

      socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
      socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.on(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);

      return () => {
        socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleStatusUpdate);
        socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
        socket.off(SOCKET_EVENTS.QUOTATION_RECEIVED, handleQuotationReceived);
        leaveRoom(requestId);
        mounted = false;
      };
    }

    return () => {
      leaveRoom(requestId);
      mounted = false;
    };
  }, [requestId, socket, joinRoom, leaveRoom, markRead]);

  // Handle student sending a new message
  const handleSendMessage = async (content: string, file?: File) => {
    // Optimistic message
    const tempId = "msg_temp_" + Math.random().toString(36).substring(2, 9);
    const newMsg: Message = {
      id: tempId,
      requestId,
      senderId: user?.id || "usr_aarav_01",
      senderRole: "student",
      content: content || (file ? `Uploaded reference file: ${file.name}` : ""),
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
        // Send via multipart REST
        const formData = new FormData();
        formData.append("content", content || `Uploaded reference file: ${file.name}`);
        formData.append("document", file);
        const saved = await api.chat.postMessage(requestId, formData);
        if (saved) {
          const adapted = adaptMessageToFrontend(saved);
          setMessages((prev) => prev.map((m) => (m.id === tempId ? adapted : m)));
        }
      } else {
        // Send via real-time WebSocket
        if (socket?.connected) {
          await sendMessage(requestId, content, "TEXT");
        } else {
          await api.chat.postMessage(requestId, { content, messageType: "TEXT" });
        }
      }
    } catch (err: any) {
      console.warn("Message sending fallback:", err);
      // Simulate delivered tick if offline
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "delivered" } : m))
        );
      }, 600);
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
      content: `50% Advance Milestone payment of ₹${currentQuotation?.advanceAmount || 0} verified (Ref: ${transactionId}). Work has officially commenced!`,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "read",
    };

    setMessages((prev) => [...prev, confirmMsg]);
    toast.success("Advance paid! Specialist has started work on your assignment.");
  };

  const handleRequestChange = (q: Quotation) => {
    handleSendMessage("I'd like to request an adjustment to the quotation scope or page count.");
    toast.info("Change request sent in chat.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
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
                {request.id}
              </span>
              <StatusBadge status={request.status} className="text-[10px] py-0 px-1.5 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground truncate leading-tight">
              {request.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link href={`/user/requests/${request.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
              Task Details
            </Button>
          </Link>
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
              />
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderRole === "student" || msg.senderRole === "USER"}
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
    </div>
  );
}
