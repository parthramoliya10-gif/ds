"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Stepper } from "@/components/shared/Stepper";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { AttachmentBubble } from "@/components/chat/AttachmentBubble";
import { QuotationCard } from "@/components/chat/QuotationCard";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { CreateQuotationModal } from "@/components/admin/CreateQuotationModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { mockRequests, mockQuotations, mockMessages } from "@/lib/mock-data";
import { Request, Quotation, Message } from "@/types";
import { formatCurrencyINR, formatDate, isDeadlineUrgent } from "@/lib/utils";
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Clock,
  Download,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  School,
  GraduationCap,
  Mail,
  Phone,
  FileCheck,
  Eye,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminRequestDetailPage() {
  const params = useParams();
  const requestId = (params?.id as string) || "REQ-1001";

  // Lookup request
  const baseRequest = mockRequests.find((r) => r.id === requestId) || mockRequests[0];
  const [request, setRequest] = React.useState<Request>(baseRequest);

  // Associated quotations
  const existingQuotation = mockQuotations.find((q) => q.requestId === request.id) || {
    id: "QT-" + request.id,
    requestId: request.id,
    amount: 1400,
    advanceAmount: 700,
    remainingAmount: 700,
    estimatedDelivery: "Within 24 Hours",
    status: "pending",
    createdAt: new Date().toISOString(),
    notes: "Complete lab manual with verified socket programs, Wireshark captures, and DTU formatting standard.",
  };

  const [quotations, setQuotations] = React.useState<Quotation[]>([
    existingQuotation as Quotation,
  ]);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<{ name: string; size: string } | null>(null);

  // Embedded chat messages state
  const initialMessages: Message[] = mockMessages[request.id] || [
    {
      id: "msg_admin_1",
      requestId: request.id,
      senderId: "usr_aarav_01",
      senderRole: "student",
      content: `Hello! I have submitted this task for "${request.title}". Please review the syllabus PDF attached and share quotation.`,
      timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      type: "text",
      status: "read",
    },
    {
      id: "msg_admin_2",
      requestId: request.id,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Hi Aarav, our academic specialist is inspecting your formatting guidelines. Quotation incoming.",
      timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      type: "text",
      status: "read",
    },
    {
      id: "msg_admin_3",
      requestId: request.id,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "Official quotation prepared with verified 50-50 milestone protection.",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      type: "quotation",
      status: "read",
      quotation: existingQuotation as Quotation,
    },
  ];

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string, file?: File) => {
    const newMsg: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      requestId: request.id,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: content || (file ? `Attached file: ${file.name}` : ""),
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

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 600);
  };

  const handleCreateQuotation = (newQuotation: Quotation) => {
    setQuotations((prev) => [newQuotation, ...prev]);
    setRequest((prev) => ({
      ...prev,
      status: "quoted",
    }));

    // Post quotation into the chat feed
    const quoteMessage: Message = {
      id: "msg_quote_" + Math.random().toString(36).substring(2, 9),
      requestId: request.id,
      senderId: "usr_admin_01",
      senderRole: "admin",
      content: "New quotation dispatched to student:",
      timestamp: new Date().toISOString(),
      type: "quotation",
      status: "sent",
      quotation: newQuotation,
    };

    setMessages((prev) => [...prev, quoteMessage]);
    toast.success(`Quotation ${newQuotation.id} created and posted to chat.`);
  };

  const isUrgent = isDeadlineUrgent(request.deadline);

  // Reference files list
  const referenceFiles = [
    {
      name: `${request.subject.replace(/[^a-zA-Z0-9]/g, "_")}_Syllabus_Prompt.pdf`,
      size: "2.4 MB",
      type: "Assignment Prompt & Lab Tasks",
    },
    {
      name: `${request.college.replace(/[^a-zA-Z0-9]/g, "_")}_Manual_Template_Format.docx`,
      size: "820 KB",
      type: "College Format / Font Specification",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/admin/requests"
          className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to all requests
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[14px] font-semibold text-muted-foreground">
              {request.id}
            </span>
            <StatusBadge status={request.status} />
            {isUrgent && (
              <Badge variant="boldBorder" className="text-[11px] flex items-center space-x-1">
                <Clock className="h-3 w-3 mr-1" />
                Urgent (&lt;24h)
              </Badge>
            )}
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-foreground">
            {request.title}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsQuotationModalOpen(true)}
            className="h-9 text-[13px] font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Quotation
          </Button>
          <Link href={`/admin/chat/${request.id}`}>
            <Button variant="outline" className="h-9 text-[13px] border-border">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Full Screen Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Stepper */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none">
        <CardHeader className="py-3 px-4 sm:px-6 border-b border-border">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Order Lifecycle Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Stepper currentStatus={request.status} />
        </CardContent>
      </Card>

      {/* 2-Column Split: Left Details & Right Embedded Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Student Profile & Academic Details */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-foreground" />
                <CardTitle className="text-[16px] font-semibold text-foreground">
                  Student Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Student Full Name
                  </span>
                  <span className="font-semibold text-foreground text-[14px]">
                    {request.studentName}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    College / University
                  </span>
                  <span className="font-medium text-foreground flex items-center">
                    <School className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {request.college}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Academic Semester & Branch
                  </span>
                  <span className="font-medium text-foreground flex items-center">
                    <GraduationCap className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {request.semester} • CSE Department
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Official College Email
                  </span>
                  <span className="font-mono text-muted-foreground flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {request.studentName.toLowerCase().replace(" ", ".")}@dtu.ac.in
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Description & Scope */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[16px] font-semibold text-foreground">
                    Task Scope & Instructions
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[11px] capitalize">
                  {request.format} Deliverable
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[8px] bg-surface border border-border text-[12px]">
                <div>
                  <span className="text-muted-foreground block">Subject</span>
                  <span className="font-semibold text-foreground">{request.subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Page Count</span>
                  <span className="font-semibold text-foreground">{request.pages} pages</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Format</span>
                  <span className="font-semibold text-foreground capitalize">{request.format}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Deadline</span>
                  <span className="font-semibold text-foreground">{formatDate(request.deadline)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Detailed Student Prompt
                </span>
                <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap bg-background p-3 rounded-[6px] border border-border">
                  {request.description ||
                    "Complete academic submission adhering strictly to the university formatting rubric and laboratory manual guidelines."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reference Files */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[16px] font-semibold text-foreground">
                    Uploaded Reference Files ({referenceFiles.length})
                  </CardTitle>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  Supplied by student
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {referenceFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-[6px] border border-border bg-surface hover:bg-surface/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="truncate">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {file.size} • {file.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                      className="h-8 text-[12px] border-border"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success(`Downloaded reference file: ${file.name}`)}
                      className="h-8 text-[12px] border-border"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quotation Versions */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[16px] font-semibold text-foreground">
                    Quotation Versions & History ({quotations.length})
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuotationModalOpen(true)}
                  className="h-8 text-[12px] border-border font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Quotation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {quotations.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 rounded-[8px] border border-border bg-background space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[13px] font-bold text-foreground">
                        {quote.id}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {quote.status}
                      </Badge>
                    </div>
                    <span className="text-[12px] text-muted-foreground">
                      Created: {formatDate(quote.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    <div className="p-2 rounded-[6px] bg-surface border border-border">
                      <span className="text-muted-foreground block text-[11px]">Total Fee</span>
                      <span className="text-[14px] font-bold text-foreground">
                        {formatCurrencyINR(quote.amount)}
                      </span>
                    </div>
                    <div className="p-2 rounded-[6px] bg-surface border border-border">
                      <span className="text-muted-foreground block text-[11px]">50% Advance</span>
                      <span className="text-[14px] font-bold text-foreground">
                        {formatCurrencyINR(quote.advanceAmount)}
                      </span>
                    </div>
                    <div className="p-2 rounded-[6px] bg-surface border border-border">
                      <span className="text-muted-foreground block text-[11px]">50% Balance</span>
                      <span className="text-[14px] font-bold text-foreground">
                        {formatCurrencyINR(quote.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[12px] space-y-1">
                    <span className="text-muted-foreground">
                      Turnaround: <strong className="text-foreground">{quote.estimatedDelivery}</strong>
                    </span>
                    {quote.notes && (
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Scope notes: {quote.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Embedded Chat (col-span-5) */}
        <div className="lg:col-span-5">
          <Card className="rounded-[8px] border border-border bg-background shadow-none flex flex-col h-[750px] overflow-hidden sticky top-6">
            <CardHeader className="py-3 px-4 border-b border-border bg-surface shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[14px] font-semibold text-foreground">
                    Live Chat with {request.studentName}
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Online
                </span>
              </div>
            </CardHeader>

            {/* Embedded Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              <DateSeparator label="Today" />

              {messages.map((msg) => {
                const isMe = msg.senderRole === "admin";

                if (msg.type === "quotation" && msg.quotation) {
                  return (
                    <div key={msg.id} className="w-full my-2">
                      <QuotationCard quotation={msg.quotation} isAdmin={true} />
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

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Composer */}
            <ChatComposer
              onSendMessage={handleSendMessage}
              placeholder="Reply to student or instruct modifications..."
              extraActions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuotationModalOpen(true)}
                  className="h-10 px-2.5 text-[12px] font-semibold border-border rounded-[8px] shrink-0"
                  title="Issue new quotation"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Quote
                </Button>
              }
            />
          </Card>
        </div>
      </div>

      {/* Create Quotation Modal */}
      <CreateQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        requestId={request.id}
        requestTitle={request.title}
        defaultAmount={1400}
        onSubmitQuotation={handleCreateQuotation}
      />

      {/* Preview File Dialog */}
      <Dialog open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-lg border border-border bg-background p-6 rounded-[8px] shadow-none">
          <DialogHeader className="space-y-1 pb-3 border-b border-border">
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Document Preview
            </DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              {previewFile?.name} ({previewFile?.size})
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 text-center space-y-3">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground stroke-[1.2]" />
            <div className="text-[13px] text-foreground font-medium">
              Verified Student Submission Attachment
            </div>
            <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
              Contains prompt instructions, problem statement specifications, and university grading rubric.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewFile(null)}
              className="text-[13px] border-border"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success(`Downloading ${previewFile?.name}`);
                setPreviewFile(null);
              }}
              className="text-[13px]"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
