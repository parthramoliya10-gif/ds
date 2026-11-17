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
import { mockRequests, mockMessages, mockQuotations } from "@/lib/mock-data";
import { Message, Quotation } from "@/types";
import { ArrowLeft, ShieldCheck, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) || "REQ-1001";

  // Request & Quotation lookup
  const request =
    mockRequests.find((r) => r.id === requestId) || mockRequests[0];
  const quotation =
    mockQuotations.find((q) => q.requestId === requestId) || {
      id: "QT-" + requestId,
      requestId,
      amount: 1400,
      advanceAmount: 700,
      remainingAmount: 700,
      estimatedDelivery: "Within 24 Hours",
      status: "pending",
      createdAt: new Date().toISOString(),
      notes: "Complete lab manual with verified socket programs and Wireshark captures.",
    };

  // Chat message state
  const initialMessages: Message[] = mockMessages[requestId] || [
    {
      id: "msg_admin_c1",
      requestId,
      senderId: "usr_aarav_01",
      senderRole: "student",
      content: `Hello, I've created request ${requestId} for "${request.title}". Please review my attached guidelines and send quotation.`,
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      type: "text",
      status: "read",
    },
    {
      id: "msg_admin_c2",
      requestId,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Hello Aarav! Our specialist has reviewed the problem statement and university formatting requirements.",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      type: "text",
      status: "read",
    },
    {
      id: "msg_admin_c3",
      requestId,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Here is the official quotation with 50-50 milestone protection:",
      timestamp: new Date(Date.now() - 1800 * 1000).toISOString(),
      type: "quotation",
      status: "read",
      quotation: quotation as Quotation,
    },
  ];

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [currentQuotation, setCurrentQuotation] = React.useState<Quotation>(quotation as Quotation);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Admin sending a message
  const handleSendMessage = (content: string, file?: File) => {
    const newMsg: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: "usr_admin_01",
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

    // Simulate tick update: sent -> delivered
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 600);
  };

  // Admin creating and dispatching quotation
  const handleQuotationSubmit = (newQuote: Quotation) => {
    setCurrentQuotation(newQuote);

    const quoteMsg: Message = {
      id: "msg_quote_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Dispatched updated quotation with milestone terms:",
      timestamp: new Date().toISOString(),
      type: "quotation",
      status: "sent",
      quotation: newQuote,
    };

    setMessages((prev) => [...prev, quoteMsg]);
    toast.success(`Quotation ${newQuote.id} sent directly to student.`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Admin Chat Top Header */}
      <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center space-x-3 truncate">
          {/* Mobile Back Arrow (hidden sm:block) */}
          <Link
            href="/admin/chat"
            className="sm:hidden p-1.5 rounded-[6px] hover:bg-surface text-foreground"
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
              {request.studentName} — {request.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsQuotationModalOpen(true)}
            className="h-8 text-[12px] font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Send Quotation
          </Button>

          <Link href={`/admin/requests/${request.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Task Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        <DateSeparator label="Today" />

        {messages.map((msg) => {
          const isMe = msg.senderRole === "admin";

          if (msg.type === "quotation" && (msg.quotation || currentQuotation)) {
            const displayQuote = msg.quotation || currentQuotation;
            return (
              <div key={msg.id} className="flex flex-col items-start mb-3 w-full">
                <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
                  You (Admin)
                </span>
                <QuotationCard quotation={displayQuote} isAdmin={true} />
              </div>
            );
          }

          if (msg.attachment) {
            return (
              <React.Fragment key={msg.id}>
                {msg.content && (
                  <MessageBubble
                    message={msg}
                    isMe={isMe}
                    senderLabel={isMe ? "You (Admin)" : request.studentName}
                  />
                )}
                <AttachmentBubble attachment={msg.attachment} isMe={isMe} />
              </React.Fragment>
            );
          }

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={isMe}
              senderLabel={isMe ? "You (Admin)" : request.studentName}
            />
          );
        })}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar with "Send quotation" button */}
      <ChatComposer
        onSendMessage={handleSendMessage}
        placeholder={`Message ${request.studentName}...`}
        extraActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsQuotationModalOpen(true)}
            className="h-10 px-3 border-border rounded-[8px] text-[12px] font-semibold shrink-0 text-foreground"
            title="Create and send quotation"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Send Quotation
          </Button>
        }
      />

      {/* Create Quotation Modal */}
      <CreateQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        requestId={request.id}
        requestTitle={request.title}
        defaultAmount={currentQuotation.amount}
        onSubmitQuotation={handleQuotationSubmit}
      />
    </div>
  );
}
