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
import { Request, Quotation, FinalDocument } from "@/types";
import api from "@/lib/api/client";
import {
  adaptRequestToFrontend,
  adaptQuotationToFrontend,
  adaptFinalDocumentToFrontend,
} from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate, isDeadlineUrgent } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Eye,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";

export default function UserRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const [request, setRequest] = React.useState<Request | null>(null);
  const [quotation, setQuotation] = React.useState<Quotation | null>(null);
  const [finalDoc, setFinalDoc] = React.useState<FinalDocument | null>(null);
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const handleDeleteRequest = async () => {
    try {
      await api.requests.delete(requestId);
      toast.success("Request removed from your account");
      router.push("/user/requests");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    }
  };
  const [previewFile, setPreviewFile] = React.useState<{
    name: string;
    size: string;
    url?: string;
  } | null>(null);

  const handleDownloadFile = (file: { name: string; url?: string }) => {
    if (!file.url || file.url === "#") {
      toast.error("File download link is not available.");
      return;
    }

    try {
      toast.info(`Downloading ${file.name}...`);
      downloadFile(file.url, file.name);
      toast.success(`Download started for ${file.name}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download file.");
    }
  };

  React.useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      if (!requestId) return;
      try {
        const backendReq = await api.requests.getById(requestId);
        if (mounted && backendReq) {
          const adapted = adaptRequestToFrontend(backendReq);
          setRequest(adapted);

          if (backendReq.quotations && backendReq.quotations.length > 0) {
            setQuotation(adaptQuotationToFrontend(backendReq.quotations[0]));
          }

          if (backendReq.finalDocuments && backendReq.finalDocuments.length > 0) {
            setFinalDoc(adaptFinalDocumentToFrontend(backendReq.finalDocuments[0]));
          }
        }
      } catch (err) {
        console.warn("Could not fetch backend request by id:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4 max-w-md mx-auto text-center py-16">
        <h2 className="text-[20px] font-semibold text-foreground">Request Not Found</h2>
        <p className="text-[13px] text-muted-foreground">
          The requested task could not be found or has been removed.
        </p>
        <Link href="/user/requests">
          <Button variant="outline" size="sm">Back to Requests</Button>
        </Link>
      </div>
    );
  }

  const balanceAmount = request.balanceAmount || 0;
  const isDocLocked = !request.balancePaid;

  const handlePaymentSuccess = ({ transactionId }: { transactionId: string }) => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            balancePaid: true,
            status: "delivered",
          }
        : null
    );

    setFinalDoc((prev) =>
      prev
        ? {
            ...prev,
            isLocked: false,
          }
        : null
    );

    toast.success("Payment verified! Document is now unlocked for download.");
  };

  const handleDownload = async () => {
    if (finalDoc?.id) {
      try {
        toast.info(`Preparing download for ${finalDoc.fileName}...`);
        const res = await api.documents.getDownloadInfo(finalDoc.id);
        if (res && res.downloadUrl) {
          downloadFile(res.downloadUrl, res.fileName || finalDoc.fileName);
          toast.success(`Download started for ${finalDoc.fileName}`);
        } else {
          toast.error("Download link expired or not found.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to download document.");
      }
    } else {
      toast.info("Download not ready.");
    }
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
          <Button
            variant="outline"
            className="h-10 text-[13px] border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete this request from my account"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
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
          {finalDoc ? (
            <FinalDocumentCard
              document={finalDoc}
              remainingAmount={balanceAmount}
              isLocked={isDocLocked}
              onPayToUnlock={() => setIsRazorpayOpen(true)}
              onDownload={handleDownload}
              onRequestRevision={() => setIsRevisionOpen(true)}
            />
          ) : (
            <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-2">
              <div className="flex items-center space-x-2 text-foreground font-semibold text-[14px]">
                <Clock className="h-4 w-4" />
                <span>Deliverable Pending</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Your final completed deliverable will appear here once uploaded by the specialist.
              </p>
            </Card>
          )}

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
                <span className="text-[11px] text-muted-foreground block">Organization Name</span>
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
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                        className="h-7 text-[12px] px-2.5 border-border"
                      >
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="h-7 text-[12px] px-2.5 border-border"
                      >
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </div>
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
          setRequest((prev) => (prev ? { ...prev, status: "in_progress" } : null));
        }}
      />

      {/* Preview File Dialog */}
      <Dialog open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] border border-border bg-background p-6 rounded-[10px] shadow-none flex flex-col">
          <DialogHeader className="space-y-1 pb-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-[17px] font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {previewFile?.name}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                  {previewFile?.size} • Submitted Reference File
                </DialogDescription>
              </div>
              {previewFile?.url && (
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mr-6 py-1 px-2.5 rounded-[6px] border border-border bg-surface"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in New Tab
                </a>
              )}
            </div>
          </DialogHeader>

          {/* Actual Document Preview Body */}
          <div className="flex-1 my-3 relative overflow-hidden rounded-[8px] border border-border bg-surface flex flex-col items-center justify-center min-h-[350px]">
            {previewFile?.url ? (
              (() => {
                const ext = previewFile.name.split(".").pop()?.toLowerCase() || "";
                if (["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"].includes(ext)) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <img
                        src={previewFile.url}
                        alt={previewFile.name}
                        className="max-h-[62vh] max-w-full object-contain rounded-[6px]"
                      />
                    </div>
                  );
                }
                if (ext === "pdf") {
                  return (
                    <iframe
                      src={`${previewFile.url}#toolbar=1`}
                      title={previewFile.name}
                      className="w-full h-full min-h-[450px] border-none"
                    />
                  );
                }
                if (["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext)) {
                  return (
                    <div className="w-full h-full flex flex-col relative">
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                        title={previewFile.name}
                        className="w-full flex-1 min-h-[450px] border-none"
                      />
                    </div>
                  );
                }
                return (
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="w-full h-full min-h-[450px] border-none"
                  />
                );
              })()
            ) : (
              <div className="py-12 text-center space-y-3">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground stroke-[1.2]" />
                <div className="text-[14px] text-foreground font-semibold">
                  Preview Not Available
                </div>
                <p className="text-[12px] text-muted-foreground max-w-sm mx-auto">
                  A preview could not be generated for this file format. Please download the file to view it locally.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
            <span className="text-[12px] text-muted-foreground font-mono">
              {previewFile?.size}
            </span>
            <div className="flex items-center space-x-2">
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
                onClick={() => previewFile && handleDownloadFile(previewFile)}
                className="text-[13px] font-medium"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRequest}
        title="Delete Request from Your Account?"
        description="This will remove this request and deliverable records from your account. The specialist desk record will not be affected."
        confirmLabel="Delete Request"
        cancelLabel="Keep Request"
        isDestructive={true}
      />
    </div>
  );
}
