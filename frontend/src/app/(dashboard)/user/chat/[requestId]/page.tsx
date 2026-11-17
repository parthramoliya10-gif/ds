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
import { mockRequests, mockMessages, mockQuotations } from "@/lib/mock-data";
import { Message, Quotation, Request } from "@/types";
import { ArrowLeft, MoreVertical, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function UserChatConversationPage() {
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
      id: "msg_init_1",
      requestId,
      senderId: "usr_aarav_01",
      senderRole: "student",
      content: `Hello, I've created request ${requestId} for ${request.title}. Please review my attached syllabus and send quotation.`,
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      type: "text",
      status: "read",
    },
    {
      id: "msg_init_2",
      requestId,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Hello Aarav! We have reviewed the problem statement. Here is the official milestone quotation.",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      type: "quotation",
      status: "read",
      quotation: quotation as Quotation,
    },
  ];

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [currentQuotation, setCurrentQuotation] = React.useState<Quotation>(quotation as Quotation);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle student sending a new message
  const handleSendMessage = (content: string, file?: File) => {
    const newMsg: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: "usr_aarav_01",
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

    // Simulate tick update: sent -> delivered
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 700);

    // Simulate specialist typing and automated response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: Message = {
          id: "msg_reply_" + Math.random().toString(36).substring(2, 9),
          requestId,
          senderId: "usr_admin_01",
          senderRole: "admin",
          content: "Received your query. Our specialist is on it and will adhere strictly to your university guidelines.",
          timestamp: new Date().toISOString(),
          type: "text",
          status: "read",
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 1500);
    }, 1200);
  };

  // Handle "Accept & Pay Advance"
  const handleAcceptAndPay = (q: Quotation) => {
    setIsRazorpayOpen(true);
  };

  const handleRazorpaySuccess = ({ transactionId }: { transactionId: string }) => {
    // Update quotation status
    setCurrentQuotation((prev) => ({
      ...prev,
      status: "accepted",
    }));

    // Add confirmation message into chat
    const confirmMsg: Message = {
      id: "msg_conf_" + Math.random().toString(36).substring(2, 9),
      requestId,
      senderId: "usr_admin_01",
      senderRole: "system",
      content: `50% Advance Milestone payment of ₹${currentQuotation.advanceAmount} verified (Ref: ${transactionId}). Work has officially commenced!`,
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center space-x-3 truncate">
          {/* Mobile Back Arrow (hidden >=860px) */}
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
        <DateSeparator label="Today" />

        {messages.map((msg) => {
          const isMe = msg.senderRole === "student";

          if (msg.type === "quotation") {
            return (
              <div key={msg.id} className="flex flex-col items-start mb-3 w-full">
                <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
                  DSMS Specialist
                </span>
                <QuotationCard
                  quotation={currentQuotation}
                  onAcceptAndPay={handleAcceptAndPay}
                  onRequestChange={handleRequestChange}
                />
              </div>
            );
          }

          if (msg.attachment) {
            return (
              <React.Fragment key={msg.id}>
                {msg.content && <MessageBubble message={msg} isMe={isMe} />}
                <AttachmentBubble attachment={msg.attachment} isMe={isMe} />
              </React.Fragment>
            );
          }

          return <MessageBubble key={msg.id} message={msg} isMe={isMe} />;
        })}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar */}
      <ChatComposer onSendMessage={handleSendMessage} />

      {/* Razorpay Advance Payment Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        amount={currentQuotation.advanceAmount}
        title={request.title}
        milestoneType="advance"
        onSuccess={handleRazorpaySuccess}
      />
    </div>
  );
}
