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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate, formatShortId, isDeadlineUrgent } from "@/lib/utils";
import { downloadFile } from "@/lib/download";
import {
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Trash2,
  ShieldCheck,
  UploadCloud,
  RefreshCw,
  ArrowLeft,
  Search,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
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
  fileUrl?: string;
}

export default function AdminDocumentsPage() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [versions, setVersions] = React.useState<Record<string, DocumentVersion[]>>({});
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Search & Filter state for requests directory
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "needs_upload" | "ready" | "delivered">("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  // Upload Form State
  const [uploadedFiles, setUploadedFiles] = React.useState<FileItem[]>([]);
  const [versionTag, setVersionTag] = React.useState("v1.0");
  const [versionNote, setVersionNote] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<DocumentVersion | null>(null);

  // Selected request (if any)
  const currentRequest = React.useMemo(() => {
    if (!selectedRequestId) return null;
    return requests.find((r) => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  // Initial load: fetch all requests and their final documents
  React.useEffect(() => {
    let mounted = true;
    async function loadAdminDocs() {
      setIsLoading(true);
      try {
        const res = await api.requests.list({ limit: 100 });
        if (mounted && res && Array.isArray(res.requests)) {
          const adapted = res.requests.map(adaptRequestToFrontend);
          setRequests(adapted);

          const versionsMap: Record<string, DocumentVersion[]> = {};
          res.requests.forEach((r: any) => {
            if (r.finalDocuments && r.finalDocuments.length > 0) {
              versionsMap[r.id] = r.finalDocuments.map((fd: any, idx: number) => ({
                id: fd.id,
                requestId: r.id,
                versionTag: `v${fd.version || r.finalDocuments.length - idx}.0`,
                fileName: fd.fileName || `${r.title}.pdf`,
                fileSize: fd.fileSize ? `${(fd.fileSize / (1024 * 1024)).toFixed(1)} MB` : "2.5 MB",
                pageCount: fd.pageCount || r.pages || 20,
                uploadedAt: fd.uploadedAt || fd.createdAt || new Date().toISOString(),
                versionNote: fd.title || fd.notes || "Final verified deliverable",
                isLocked: !Boolean(r.isDownloadUnlocked),
                fileUrl: fd.secureUrl,
              }));
            }
          });
          setVersions(versionsMap);

          // Check if URL query param has requestId
          if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const reqId = urlParams.get("requestId");
            if (reqId && adapted.some((r: Request) => r.id === reqId)) {
              setSelectedRequestId(reqId);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load requests for documents:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadAdminDocs();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync documents from backend whenever selectedRequestId changes
  React.useEffect(() => {
    if (!selectedRequestId) return;
    let mounted = true;
    const req = requests.find((r) => r.id === selectedRequestId);
    const isUnlocked = Boolean(req?.balancePaid || req?.isDownloadUnlocked);

    // Auto-suggest next version tag
    const existing = versions[selectedRequestId] || [];
    const nextVer = existing.length > 0 ? `v${existing.length + 1}.0` : "v1.0";
    setVersionTag(nextVer);

    async function loadRequestDocuments() {
      try {
        const docs = await api.documents.getByRequest(selectedRequestId!);
        if (mounted && Array.isArray(docs)) {
          const mapped: DocumentVersion[] = docs.map((fd: any, idx: number) => ({
            id: fd.id,
            requestId: selectedRequestId!,
            versionTag: `v${fd.version || docs.length - idx}.0`,
            fileName: fd.fileName || "Deliverable.pdf",
            fileSize: fd.fileSize ? `${(fd.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.0 MB",
            pageCount: req?.pages || 10,
            uploadedAt: fd.createdAt || new Date().toISOString(),
            versionNote: fd.title || "Final deliverable file",
            isLocked: !isUnlocked,
            fileUrl: fd.secureUrl,
          }));
          setVersions((prev) => ({
            ...prev,
            [selectedRequestId!]: mapped,
          }));
          setVersionTag(`v${mapped.length + 1}.0`);
        }
      } catch (err) {
        console.warn("Could not load documents for request:", err);
      }
    }
    loadRequestDocuments();
    return () => {
      mounted = false;
    };
  }, [selectedRequestId, requests, versions]);

  // Handle selecting a request and update browser URL search params cleanly
  const handleSelectRequest = (id: string | null) => {
    setSelectedRequestId(id);
    setUploadedFiles([]);
    setVersionNote("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("requestId", id);
      } else {
        url.searchParams.delete("requestId");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  // Upload handler for current selected request
  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !currentRequest) return;

    if (uploadedFiles.length === 0) {
      toast.error("Please drag or select a deliverable file first.");
      return;
    }

    if (!versionTag.trim()) {
      toast.error("Please enter a valid version tag (e.g. v1.0).");
      return;
    }

    setIsUploading(true);
    const fileItem = uploadedFiles[0];

    try {
      if (fileItem.file) {
        const formData = new FormData();
        formData.append("document", fileItem.file);
        formData.append("title", `${currentRequest.title} - ${versionTag}`);
        await api.documents.upload(selectedRequestId, formData);
        toast.success(`Final deliverable uploaded successfully!`);

        // Refresh documents from backend
        const docsRes = await api.documents.getByRequest(selectedRequestId);
        if (docsRes && Array.isArray(docsRes)) {
          const isUnlocked = Boolean(currentRequest.balancePaid || currentRequest.isDownloadUnlocked);
          const mapped: DocumentVersion[] = docsRes.map((fd: any, idx: number) => ({
            id: fd.id,
            requestId: selectedRequestId,
            versionTag: `v${fd.version || docsRes.length - idx}.0`,
            fileName: fd.fileName || fileItem.name,
            fileSize: fd.fileSize ? `${(fd.fileSize / (1024 * 1024)).toFixed(1)} MB` : fileItem.size,
            pageCount: currentRequest.pages,
            uploadedAt: fd.createdAt || new Date().toISOString(),
            versionNote: fd.title || versionNote.trim() || `Uploaded ${versionTag} deliverable file.`,
            isLocked: !isUnlocked,
            fileUrl: fd.secureUrl,
          }));
          setVersions((prev) => ({
            ...prev,
            [selectedRequestId]: mapped,
          }));
          setVersionTag(`v${mapped.length + 1}.0`);
        }

        // Update request status to ready in UI
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequestId ? { ...r, status: "ready" } : r
          )
        );
      }
    } catch (err: any) {
      console.warn("Backend document upload warning:", err);
      toast.error(err.message || "Document upload failed");
    } finally {
      setUploadedFiles([]);
      setVersionNote("");
      setIsUploading(false);
    }
  };

  const handleMarkAsReady = async () => {
    if (!currentRequest) return;
    try {
      await api.requests.updateStatus(currentRequest.id, "DOCUMENT_UPLOADED");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === currentRequest.id ? { ...r, status: "ready" } : r
        )
      );
      toast.success(
        `Request ${formatShortId(currentRequest.id, "REQ")} marked as READY. Student ${currentRequest.studentName} has been notified to complete milestone balance.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDownloadDeliverable = async (version: DocumentVersion) => {
    try {
      if (version.fileUrl) {
        downloadFile(version.fileUrl, version.fileName);
        toast.success(`Downloading ${version.fileName}...`);
      } else {
        const info = await api.documents.getDownloadInfo(version.id);
        if (info?.downloadUrl) {
          downloadFile(info.downloadUrl, info.fileName || version.fileName);
          toast.success(`Downloading ${version.fileName}...`);
        } else {
          toast.error("Download link unavailable");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  };

  const handlePreview = (version: DocumentVersion) => {
    if (version.fileUrl) {
      window.open(version.fileUrl, "_blank");
    } else {
      setPreviewDoc(version);
    }
  };

  const handleToggleStudentPayment = () => {
    if (!currentRequest) return;
    const nextState = !currentRequest.balancePaid;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === currentRequest.id
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
      [currentRequest.id]: (prev[currentRequest.id] || []).map((v) => ({
        ...v,
        isLocked: !nextState,
      })),
    }));

    if (nextState) {
      toast.success(
        `Milestone payment of ${formatCurrencyINR(currentRequest.balanceAmount || 0)} marked as received! Document is now UNLOCKED for student.`
      );
    } else {
      toast.info(`Lock re-engaged: student download is now locked until payment.`);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!selectedRequestId) return;
    try {
      await api.documents.delete(versionId);
      setVersions((prev) => ({
        ...prev,
        [selectedRequestId]: (prev[selectedRequestId] || []).filter(
          (v) => v.id !== versionId
        ),
      }));
      toast.success("Document version removed from storage.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document version");
    }
  };

  // Filter and search logic for the requests directory
  const filteredRequests = React.useMemo(() => {
    return requests.filter((r) => {
      const rVersions = versions[r.id] || [];
      const hasDoc = rVersions.length > 0;
      const isDeliveredOrUnlocked = Boolean(r.balancePaid || r.isDownloadUnlocked || r.status === "delivered" || r.status === "completed");

      // Status Filter
      if (statusFilter === "needs_upload" && hasDoc) return false;
      if (statusFilter === "ready" && (!hasDoc || isDeliveredOrUnlocked)) return false;
      if (statusFilter === "delivered" && !isDeliveredOrUnlocked) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const shortCode = formatShortId(r.id, "REQ").toLowerCase();
        const matchId = (r.id || "").toLowerCase().includes(q) || shortCode.includes(q);
        const matchTitle = (r.title || "").toLowerCase().includes(q);
        const matchStudent = (r.studentName || "").toLowerCase().includes(q);
        const matchSubject = (r.subject || "").toLowerCase().includes(q);
        const matchCollege = (r.college || "").toLowerCase().includes(q);
        return matchId || matchTitle || matchStudent || matchSubject || matchCollege;
      }

      return true;
    });
  }, [requests, versions, statusFilter, searchQuery]);

  // Overall statistics for directory summary cards
  const stats = React.useMemo(() => {
    const total = requests.length;
    let needsUpload = 0;
    let readyForPayment = 0;
    let delivered = 0;

    requests.forEach((r) => {
      const hasDoc = (versions[r.id] || []).length > 0;
      const isDelivered = Boolean(r.balancePaid || r.isDownloadUnlocked || r.status === "delivered" || r.status === "completed");
      if (isDelivered) {
        delivered++;
      } else if (hasDoc) {
        readyForPayment++;
      } else {
        needsUpload++;
      }
    });

    return { total, needsUpload, readyForPayment, delivered };
  }, [requests, versions]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // =========================================================================
  // VIEW MODE A: ALL REQUESTS DIRECTORY (Default view when no request is selected)
  // =========================================================================
  if (!selectedRequestId || !currentRequest) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title="Deliverables & Document Management"
          description="Browse student academic requests, track deliverable completion status, and upload final verified task files."
        />

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[8px] border border-border bg-background p-4 shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Requests
              </span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-foreground">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Across all registered students</p>
          </Card>

          <Card
            className={`rounded-[8px] border bg-background p-4 shadow-none cursor-pointer transition-all ${
              statusFilter === "needs_upload" ? "border-amber-500 ring-1 ring-amber-500/20" : "border-border hover:border-amber-500/50"
            }`}
            onClick={() => setStatusFilter(statusFilter === "needs_upload" ? "all" : "needs_upload")}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Needs Deliverable
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.needsUpload}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Awaiting solution file upload</p>
          </Card>

          <Card
            className={`rounded-[8px] border bg-background p-4 shadow-none cursor-pointer transition-all ${
              statusFilter === "ready" ? "border-blue-500 ring-1 ring-blue-500/20" : "border-border hover:border-blue-500/50"
            }`}
            onClick={() => setStatusFilter(statusFilter === "ready" ? "all" : "ready")}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Ready for Milestone
              </span>
              <Lock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{stats.readyForPayment}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Uploaded & locked until 50% balance</p>
          </Card>

          <Card
            className={`rounded-[8px] border bg-background p-4 shadow-none cursor-pointer transition-all ${
              statusFilter === "delivered" ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-border hover:border-emerald-500/50"
            }`}
            onClick={() => setStatusFilter(statusFilter === "delivered" ? "all" : "delivered")}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Delivered / Unlocked
              </span>
              <Unlock className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.delivered}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Full milestone cleared & downloaded</p>
          </Card>
        </div>

        {/* Search, Filter Bar and Table */}
        <Card className="rounded-[8px] border border-border bg-background shadow-none">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[16px] font-semibold text-foreground">
                  Task Requests Directory
                </CardTitle>
                <CardDescription className="text-[13px] text-muted-foreground">
                  Select any task below to upload deliverable files or manage existing versions.
                </CardDescription>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="h-8 text-[12px]"
                >
                  All ({stats.total})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "needs_upload" ? "default" : "outline"}
                  onClick={() => setStatusFilter("needs_upload")}
                  className="h-8 text-[12px]"
                >
                  Needs Upload ({stats.needsUpload})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "ready" ? "default" : "outline"}
                  onClick={() => setStatusFilter("ready")}
                  className="h-8 text-[12px]"
                >
                  Ready ({stats.readyForPayment})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "delivered" ? "default" : "outline"}
                  onClick={() => setStatusFilter("delivered")}
                  className="h-8 text-[12px]"
                >
                  Delivered ({stats.delivered})
                </Button>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="pt-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Request ID, Student name, Task title, Subject..."
                  className="pl-9 h-9 text-[13px] bg-background border-border"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground text-[13px] flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span>Loading requests directory...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  icon={<FileText className="h-8 w-8 stroke-[1.5]" />}
                  title="No Matching Requests Found"
                  description={
                    searchQuery
                      ? `No requests matched "${searchQuery}". Try adjusting your search query.`
                      : "There are currently no task requests matching the selected filter."
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-surface/50">
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase w-28">Req ID</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase">Student</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase">Task & Subject</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase">Deliverables</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase">Milestone 2</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase">Deadline</TableHead>
                      <TableHead className="text-[12px] font-semibold text-muted-foreground uppercase text-right w-44">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((req) => {
                      const reqVersions = versions[req.id] || [];
                      const hasDeliverable = reqVersions.length > 0;
                      const isUnlocked = Boolean(req.balancePaid || req.isDownloadUnlocked);
                      const balanceDue = req.balanceAmount || 0;
                      const urgent = req.urgent || isDeadlineUrgent(req.deadline);

                      return (
                        <TableRow
                          key={req.id}
                          onClick={() => handleSelectRequest(req.id)}
                          className="border-b border-border hover:bg-surface/80 cursor-pointer transition-colors"
                        >
                          {/* Request ID */}
                          <TableCell className="font-mono text-[12px] font-semibold text-foreground">
                            {formatShortId(req.id, "REQ")}
                          </TableCell>

                          {/* Student Info */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-[13px]">
                                {req.studentName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {req.college} • Sem {req.semester}
                              </span>
                            </div>
                          </TableCell>

                          {/* Task & Subject */}
                          <TableCell>
                            <div className="flex flex-col max-w-sm">
                              <span className="font-semibold text-foreground line-clamp-1 text-[13px]">
                                {req.title}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {req.subject} • {req.pages} pages • {req.format}
                              </span>
                            </div>
                          </TableCell>

                          {/* Deliverable Status */}
                          <TableCell>
                            {hasDeliverable ? (
                              <div className="flex items-center space-x-1.5">
                                <Badge variant="outline" className="text-[11px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {reqVersions[0].versionTag} ({reqVersions.length} ver)
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Needs Deliverable
                              </Badge>
                            )}
                          </TableCell>

                          {/* Milestone 2 Escrow */}
                          <TableCell>
                            {isUnlocked ? (
                              <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-[12px] font-semibold">
                                <Unlock className="h-3.5 w-3.5" />
                                <span>Unlocked</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-mono text-[12px] font-semibold text-foreground">
                                  {balanceDue > 0 ? formatCurrencyINR(balanceDue) : "Pending"}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center">
                                  <Lock className="h-2.5 w-2.5 mr-0.5" /> Locked
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* Deadline */}
                          <TableCell>
                            <div className="flex items-center space-x-1.5 whitespace-nowrap">
                              <span className="text-[12px] text-muted-foreground">
                                {formatDate(req.deadline)}
                              </span>
                              {urgent && (
                                <StatusBadge status="urgent" label="Urgent" className="text-[10px] py-0 px-1.5 h-4" />
                              )}
                            </div>
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {hasDeliverable ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectRequest(req.id)}
                                className="h-8 text-[12px] border-border font-medium"
                              >
                                <FolderOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                Manage ({reqVersions.length})
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleSelectRequest(req.id)}
                                className="h-8 text-[12px] font-semibold"
                              >
                                <UploadCloud className="h-3.5 w-3.5 mr-1" />
                                Upload File
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border text-[12px] text-muted-foreground">
                <span>
                  Showing page {currentPage} of {totalPages} ({filteredRequests.length} total tasks)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 border-border"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 border-border"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE B: SPECIFIC REQUEST DELIVERABLES WORKSPACE
  // =========================================================================
  const currentVersions = versions[selectedRequestId] || [];
  const balanceDue = currentRequest.balanceAmount || 0;
  const isUnlocked = Boolean(currentRequest.balancePaid || currentRequest.isDownloadUnlocked);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Request Header Banner */}
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectRequest(null)}
          className="h-8 text-[12px] border-border text-foreground hover:bg-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to All Requests
        </Button>

        <Card className="rounded-[8px] border border-border bg-background shadow-none p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="font-mono text-[12px] font-bold">
                  {formatShortId(currentRequest.id, "REQ")}
                </Badge>
                <h2 className="text-[16px] font-bold text-foreground">
                  {currentRequest.title}
                </h2>
              </div>
              <p className="text-[13px] text-muted-foreground">
                Student: <strong className="text-foreground">{currentRequest.studentName}</strong> • {currentRequest.college} • {currentRequest.subject} ({currentRequest.pages} pages, {currentRequest.format})
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Current Status</span>
                <StatusBadge status={currentRequest.status} />
              </div>
              <div className="text-right border-l border-border pl-4">
                <span className="text-[11px] text-muted-foreground block">Deadline</span>
                <span className="text-[13px] font-medium text-foreground">
                  {formatDate(currentRequest.deadline)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
                      placeholder="e.g. v1.0, v2.0"
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
                    Target: <strong className="text-foreground">{currentRequest.title}</strong>
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
                      ? `Student ${currentRequest.studentName} has cleared the remaining milestone. Full file download is unlocked.`
                      : balanceDue > 0
                      ? `Download is locked. Student sees a blurred preview and 'Pay ${formatCurrencyINR(balanceDue)} to unlock' button.`
                      : `Awaiting quotation dispatch. Once quotation is accepted and advance is paid, milestone escrow tracking activates.`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleMarkAsReady}
                  disabled={
                    currentRequest.status === "ready" ||
                    currentRequest.status === "document_uploaded" ||
                    currentRequest.status === "delivered" ||
                    currentRequest.status === "completed"
                  }
                  className="w-full h-10 text-[13px] font-semibold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {currentRequest.status === "ready" ||
                  currentRequest.status === "document_uploaded" ||
                  currentRequest.status === "delivered" ||
                  currentRequest.status === "completed"
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
              {formatShortId(currentRequest.id, "REQ")} • {currentRequest.title}
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
                      onClick={() => handlePreview(version)}
                      className="h-8 text-[12px] border-border"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDeliverable(version)}
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
                if (previewDoc) handleDownloadDeliverable(previewDoc);
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
