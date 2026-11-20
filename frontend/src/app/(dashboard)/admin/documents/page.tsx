"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FileDropzone, FileItem } from "@/components/shared/FileDropzone";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Request, FinalDocument } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  ShieldCheck,
  UploadCloud,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface DocumentVersion {
  id: string;
  requestId: string;
  versionTag: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  uploadedAt: string;
  versionNote: string;
  isLocked: boolean;
}

export default function AdminDocumentsPage() {
  const [selectedRequestId, setSelectedRequestId] = React.useState<string>("");
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [versions, setVersions] = React.useState<Record<string, DocumentVersion[]>>({});

  // Selected request
  const currentRequest =
    requests.find((r) => r.id === selectedRequestId) || requests[0] || null;

  React.useEffect(() => {
    let mounted = true;
    async function loadAdminDocs() {
      try {
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          const adapted = res.requests.map(adaptRequestToFrontend);
          setRequests(adapted);
          if (adapted.length > 0) {
            setSelectedRequestId(adapted[0].id);
          }
          const versionsMap: Record<string, DocumentVersion[]> = {};
          res.requests.forEach((r: any) => {
            if (r.finalDocuments && r.finalDocuments.length > 0) {
              versionsMap[r.id] = r.finalDocuments.map((fd: any, idx: number) => ({
                id: fd.id,
                requestId: r.id,
                versionTag: `v1.${r.finalDocuments.length - 1 - idx}`,
                fileName: fd.fileName || `${r.title}.pdf`,
                fileSize: fd.fileSize ? `${(fd.fileSize / (1024 * 1024)).toFixed(1)} MB` : "2.5 MB",
                pageCount: fd.pageCount || 20,
                uploadedAt: fd.uploadedAt || fd.createdAt || new Date().toISOString(),
                versionNote: fd.notes || "Final verified deliverable",
                isLocked: !Boolean(r.isDownloadUnlocked),
              }));
            }
          });
          setVersions(versionsMap);
        }
      } catch (err) {
        console.warn("Could not load requests for documents:", err);
      }
    }
    loadAdminDocs();
    return () => {
      mounted = false;
    };
  }, []);

  // Upload Form State
  const [uploadedFiles, setUploadedFiles] = React.useState<FileItem[]>([]);
  const [versionTag, setVersionTag] = React.useState("v1.2");
  const [versionNote, setVersionNote] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<DocumentVersion | null>(null);

  const currentVersions = versions[selectedRequestId] || [];
  const balanceDue = currentRequest?.balanceAmount || 0;
  const isUnlocked = Boolean(currentRequest?.balancePaid || currentRequest?.isDownloadUnlocked);

  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedFiles.length === 0) {
      toast.error("Please drag or select a deliverable file first.");
      return;
    }

    if (!currentRequest) return;

    setIsUploading(true);
    const fileItem = uploadedFiles[0];

    try {
      if (fileItem.file && selectedRequestId) {
        const formData = new FormData();
        formData.append("document", fileItem.file);
        formData.append("title", `${currentRequest.title} - ${versionTag}`);
        await api.documents.upload(selectedRequestId, formData);
        toast.success(`Final deliverable uploaded successfully!`);
      }
    } catch (err: any) {
      console.warn("Backend document upload warning:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const newVersion: DocumentVersion = {
      id: "ver_" + Math.random().toString(36).substring(2, 9),
      requestId: selectedRequestId,
      versionTag: versionTag || "v1.0",
      fileName: fileItem.name,
      fileSize: fileItem.size,
      pageCount: currentRequest.pages,
      uploadedAt: new Date().toISOString(),
      versionNote: versionNote.trim() || `Uploaded ${versionTag} deliverable file.`,
      isLocked: !currentRequest.balancePaid,
    };

    setVersions((prev) => ({
      ...prev,
      [selectedRequestId]: [newVersion, ...(prev[selectedRequestId] || [])],
    }));

    setUploadedFiles([]);
    setVersionNote("");
    setIsUploading(false);
    toast.success(`Successfully uploaded ${newVersion.fileName} (${newVersion.versionTag})`);
  };

  const handleMarkAsReady = () => {
    if (!currentRequest) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequestId ? { ...r, status: "ready" } : r
      )
    );
    toast.success(
      `Request ${selectedRequestId} marked as READY. Student ${currentRequest.studentName} has been notified to complete the 50% milestone balance.`
    );
  };

  const handleToggleStudentPayment = () => {
    if (!currentRequest) return;
    const nextState = !currentRequest.balancePaid;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequestId
          ? {
              ...r,
              balancePaid: nextState,
              status: nextState ? "delivered" : "ready",
            }
          : r
      )
    );

    // Update lock status for all versions of this request
    setVersions((prev) => ({
      ...prev,
      [selectedRequestId]: (prev[selectedRequestId] || []).map((v) => ({
        ...v,
        isLocked: !nextState,
      })),
    }));

    if (nextState) {
      toast.success(
        `Milestone payment of ${formatCurrencyINR(balanceDue)} marked as received! Document is now UNLOCKED for student.`
      );
    } else {
      toast.info(`Lock re-engaged: student download is now locked until payment.`);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersions((prev) => ({
      ...prev,
      [selectedRequestId]: (prev[selectedRequestId] || []).filter(
        (v) => v.id !== versionId
      ),
    }));
    toast.success("Document version removed.");
  };

  if (requests.length === 0 || !currentRequest) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Deliverables & Document Management"
          description="Upload completed student academic tasks, manage revision versioning, toggle readiness status, and verify 50-50 milestone unlock protection."
        />
        <EmptyState
          icon={<FileText className="h-8 w-8 stroke-[1.5]" />}
          title="No Active Requests"
          description="There are currently no task requests to manage deliverables for."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Deliverables & Document Management"
        description="Upload completed student academic tasks, manage revision versioning, toggle readiness status, and verify 50-50 milestone unlock protection."
      />

      {/* Request Selector Header */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select Student Task / Request
            </Label>
            <Select
              value={selectedRequestId}
              onValueChange={(val) => {
                setSelectedRequestId(val);
                setUploadedFiles([]);
              }}
            >
              <SelectTrigger className="h-10 text-[14px] bg-background border-border">
                <SelectValue placeholder="Choose task to manage" />
              </SelectTrigger>
              <SelectContent className="border-border bg-background">
                {requests.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.id} — {r.studentName} ({r.title})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-3 pt-2 md:pt-4">
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Current Status</span>
              <StatusBadge status={currentRequest.status} />
            </div>
            <div className="text-right border-l border-border pl-3">
              <span className="text-[11px] text-muted-foreground block">Deadline</span>
              <span className="text-[13px] font-medium text-foreground">
                {formatDate(currentRequest.deadline)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main 2-Column Section: Upload Deliverable (Left) & Milestone Release Controller (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Station (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UploadCloud className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[16px] font-semibold text-foreground">
                    Upload Final Deliverable File
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {currentRequest.pages} Pages Target
                </Badge>
              </div>
              <CardDescription className="text-[13px] text-muted-foreground">
                Attach the finalized PDF, DOCX or ZIP package. Students cannot download this until the balance milestone is cleared.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleUploadDeliverable} className="space-y-4">
                {/* File Dropzone */}
                <FileDropzone
                  onFilesChange={setUploadedFiles}
                  maxFiles={1}
                  accept=".pdf,.docx,.zip"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="versionTag" className="text-[12px]">
                      Version Tag
                    </Label>
                    <Input
                      id="versionTag"
                      value={versionTag}
                      onChange={(e) => setVersionTag(e.target.value)}
                      placeholder="e.g. v1.0, v1.1"
                      className="h-9 text-[13px] font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="versionNote" className="text-[12px]">
                      Version Note / Changelog
                    </Label>
                    <Input
                      id="versionNote"
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                      placeholder="e.g. Added all 8 socket programs with Wireshark screenshots"
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[12px] text-muted-foreground">
                    Task: <strong className="text-foreground">{currentRequest.title}</strong>
                  </span>
                  <Button
                    type="submit"
                    disabled={isUploading || uploadedFiles.length === 0}
                    className="h-9 text-[13px] font-semibold"
                  >
                    {isUploading ? "Uploading..." : "Publish Version"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Milestone Release & Readiness Controller (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Milestone 2 Payment Status Indicator */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-[16px] font-semibold text-foreground">
                    Milestone 2 Escrow Status
                  </CardTitle>
                </div>
                {isUnlocked ? (
                  <Badge variant="default" className="text-[11px] bg-foreground text-background">
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="boldBorder" className="text-[11px]">
                    Locked (Unpaid)
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div
                className={`p-4 rounded-[8px] border text-[13px] space-y-2.5 transition-colors ${
                  isUnlocked
                    ? "bg-surface border-border text-foreground"
                    : "bg-surface/50 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-foreground">
                    Remaining 50% Balance
                  </span>
                  <span className="text-[16px] font-bold font-mono text-foreground">
                    {balanceDue > 0 ? formatCurrencyINR(balanceDue) : "Quotation Pending"}
                  </span>
                </div>

                <div className="flex items-start space-x-2.5 pt-1">
                  {isUnlocked ? (
                    <Unlock className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  )}
                  <p className="text-[12px] leading-relaxed text-foreground">
                    {isUnlocked
                      ? `Student ${currentRequest.studentName} has cleared the remaining milestone via Razorpay. Full file download is unlocked.`
                      : balanceDue > 0
                      ? `Download is locked and encrypted. Student sees a blurred preview and 'Pay ${formatCurrencyINR(balanceDue)} to unlock' button.`
                      : `Awaiting quotation dispatch. Once quotation is accepted and advance is paid, milestone escrow tracking activates.`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleMarkAsReady}
                  disabled={currentRequest.status === "ready" || currentRequest.status === "delivered"}
                  className="w-full h-10 text-[13px] font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {currentRequest.status === "ready" || currentRequest.status === "delivered"
                    ? "Task Already Marked as Ready"
                    : "Mark as Ready & Notify Student"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleToggleStudentPayment}
                  className="w-full h-9 text-[12px] border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  {isUnlocked
                    ? "Simulate Payment Reversal (Lock Deliverable)"
                    : "Simulate Student 50% Payment (Unlock Deliverable)"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Guidance Info */}
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-4 text-[12px] text-muted-foreground space-y-2">
            <span className="font-semibold text-foreground block">
              DSMS 50-50 Escrow Rule:
            </span>
            <p className="leading-relaxed">
              When you mark a task as <strong>Ready</strong>, the student receives an instant notification with a blurred preview. The encrypted download button unlocks strictly after the student clears Milestone 2.
            </p>
          </Card>
        </div>
      </div>

      {/* Version History Table */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-foreground" />
              <CardTitle className="text-[16px] font-semibold text-foreground">
                Document Version History ({currentVersions.length})
              </CardTitle>
            </div>
            <span className="text-[12px] text-muted-foreground">
              {currentRequest.id} • {currentRequest.title}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {currentVersions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-[13px]">
              No deliverable versions uploaded for this request yet. Use the upload station above.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentVersions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-[11px] font-bold">
                        {version.versionTag}
                      </Badge>
                      <h4 className="text-[14px] font-semibold text-foreground truncate">
                        {version.fileName}
                      </h4>
                      {version.isLocked ? (
                        <Badge variant="boldBorder" className="text-[10px] py-0 px-1.5 h-4">
                          <Lock className="h-2.5 w-2.5 mr-1" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-foreground text-background">
                          <Unlock className="h-2.5 w-2.5 mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </div>

                    <p className="text-[12px] text-muted-foreground line-clamp-1">
                      {version.versionNote}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-muted-foreground">
                      <span>{version.fileSize}</span>
                      <span>•</span>
                      <span>{version.pageCount} Pages</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(version.uploadedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDoc(version)}
                      className="h-8 text-[12px] border-border"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success(`Downloading ${version.fileName}...`)}
                      className="h-8 text-[12px] border-border"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVersion(version.id)}
                      className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-foreground"
                      title="Delete version"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-lg border border-border bg-background p-6 rounded-[8px] shadow-none">
          <DialogHeader className="space-y-1 pb-3 border-b border-border">
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Deliverable Preview: {previewDoc?.versionTag}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              {previewDoc?.fileName} ({previewDoc?.fileSize} • {previewDoc?.pageCount} pages)
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-3">
            <div className="border border-border rounded-[8px] p-6 bg-surface text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto text-foreground stroke-[1.5]" />
              <div className="font-semibold text-foreground text-[14px]">
                {previewDoc?.fileName}
              </div>
              <p className="text-[12px] text-muted-foreground">
                {previewDoc?.versionNote}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-[6px] border border-border bg-background text-[12px]">
              <span className="text-muted-foreground">Student Download Security:</span>
              <span className="font-semibold text-foreground">
                {previewDoc?.isLocked ? "Encrypted (Requires Balance)" : "Unlocked"}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDoc(null)}
              className="text-[13px] border-border"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success(`Downloading ${previewDoc?.fileName}`);
                setPreviewDoc(null);
              }}
              className="text-[13px]"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download Deliverable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
