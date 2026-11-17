"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Stepper } from "@/components/shared/Stepper";
import { FinalDocumentCard } from "@/components/documents/FinalDocumentCard";
import { RevisionModal } from "@/components/documents/RevisionModal";
import { RazorpayModal } from "@/components/payments/RazorpayModal";
import { MilestoneProgressBar } from "@/components/payments/MilestoneProgressBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockRequests, mockQuotations, mockDocuments } from "@/lib/mock-data";
import { Request, Quotation, FinalDocument } from "@/types";
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
} from "lucide-react";
import { toast } from "sonner";

export default function UserRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  // Find request in mock data
  const baseRequest = mockRequests.find((r) => r.id === requestId) || mockRequests[1]; // default to REQ-1002
  const [request, setRequest] = React.useState<Request>(baseRequest);

  // Associated quotation
  const quotation = mockQuotations.find((q) => q.requestId === request.id) || mockQuotations[1];

  // Associated final document
  const initialDoc = mockDocuments.find((d) => d.requestId === request.id) || {
    id: "DOC-" + request.id,
    requestId: request.id,
    fileName: `${request.title.replace(/[^a-zA-Z0-9]/g, "_")}_Final.pdf`,
    fileSize: "6.4 MB",
    pageCount: request.pages,
    fileUrl: "#",
    isLocked: !request.balancePaid,
    uploadedAt: new Date().toISOString(),
  };

  const [finalDoc, setFinalDoc] = React.useState<FinalDocument>(initialDoc);
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = React.useState(false);

  const balanceAmount = request.balanceAmount || 900;
  const isDocLocked = !request.balancePaid;

  const handlePaymentSuccess = ({ transactionId }: { transactionId: string }) => {
    // Update local state: balance is paid, document is unlocked!
    setRequest((prev) => ({
      ...prev,
      balancePaid: true,
      status: "delivered",
    }));

    setFinalDoc((prev) => ({
      ...prev,
      isLocked: false,
    }));

    toast.success("Payment verified! Document is now unlocked for download.");
  };

  const handleDownload = () => {
    toast.success(`Downloading ${finalDoc.fileName}...`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/user/requests"
          className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to all requests
        </Link>
      </div>

      {/* Header with Status and Chat CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[12px] font-semibold text-muted-foreground">
              {request.id}
            </span>
            <StatusBadge status={request.status} />
            {(request.urgent || isDeadlineUrgent(request.deadline)) && (
              <StatusBadge status="urgent" label="Urgent" />
            )}
          </div>
          <h1 className="text-[26px] font-semibold text-foreground tracking-tight">
            {request.title}
          </h1>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link href={`/user/chat/${request.id}`}>
            <Button className="h-10 text-[13px] font-medium">
              <MessageSquare className="h-4 w-4 mr-2" />
              Live Task Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Stepper Timeline */}
      <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none">
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Milestone Progression
        </div>
        <Stepper currentStatus={request.status} />
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Deliverable */}
        <div className="lg:col-span-2 space-y-6">
          {/* Final Document Card with Lock/Unlock Flow */}
          <FinalDocumentCard
            document={finalDoc}
            remainingAmount={balanceAmount}
            isLocked={isDocLocked}
            onPayToUnlock={() => setIsRazorpayOpen(true)}
            onDownload={handleDownload}
            onRequestRevision={() => setIsRevisionOpen(true)}
          />

          {/* Task Specifications */}
          <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-3">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-[16px] font-semibold text-foreground">
                Task Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-muted-foreground block">Subject</span>
                <span className="font-semibold text-foreground">{request.subject}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Format</span>
                <span className="font-semibold text-foreground capitalize">{request.format}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Page Count</span>
                <span className="font-semibold text-foreground">{request.pages} Pages</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">University</span>
                <span className="font-semibold text-foreground">{request.college}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Semester</span>
                <span className="font-semibold text-foreground">Semester {request.semester}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Deadline</span>
                <span className="font-semibold text-foreground">{formatDate(request.deadline)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Reference Files List */}
          <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-3">
            <CardHeader className="p-0 pb-1">
              <CardTitle className="text-[16px] font-semibold text-foreground">
                Submitted Problem Files & Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {request.files && request.files.length > 0 ? (
                request.files.map((file) => (
                  <div key={file.id} className="py-2.5 flex items-center justify-between text-[13px]">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{file.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">({file.size})</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[12px] px-2 text-muted-foreground hover:text-foreground">
                      <Download className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-muted-foreground py-2">No files attached.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Milestone Tracker & Financial Summary */}
        <div className="space-y-6">
          <MilestoneProgressBar
            totalAmount={request.totalAmount || 1800}
            advanceAmount={request.advanceAmount || 900}
            remainingAmount={balanceAmount}
            advancePaid={request.advancePaid}
            balancePaid={request.balancePaid}
          />

          {/* Quotation Summary */}
          {quotation && (
            <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-3">
              <CardHeader className="p-0 pb-1">
                <CardTitle className="text-[15px] font-semibold text-foreground">
                  Quotation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2 text-[13px]">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span className="font-semibold text-foreground">{quotation.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Total Quoted</span>
                  <span className="font-semibold text-foreground">{formatCurrencyINR(quotation.amount)}</span>
                </div>
                <p className="text-[12px] text-muted-foreground pt-1 leading-relaxed">
                  {quotation.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Razorpay Checkout Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        amount={balanceAmount}
        title={request.title}
        milestoneType="remaining"
        onSuccess={handlePaymentSuccess}
      />

      {/* Revision Request Modal */}
      <RevisionModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        requestId={request.id}
        requestTitle={request.title}
        onSubmitRevision={(notes) => {
          setRequest((prev) => ({ ...prev, status: "in_progress" }));
        }}
      />
    </div>
  );
}
