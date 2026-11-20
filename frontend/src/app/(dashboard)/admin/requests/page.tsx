"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatDate, isDeadlineUrgent } from "@/lib/utils";
import { FileText, Eye, MessageSquare, Filter, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

export default function AdminRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("all");
  const [formatFilter, setFormatFilter] = React.useState("all");
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);

  const confirmDeleteRequest = async () => {
    if (!deleteRequestId) return;
    try {
      await api.requests.delete(deleteRequestId);
      setRequests((prev) => prev.filter((r) => r.id !== deleteRequestId));
      toast.success("Request removed from admin portal");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    } finally {
      setDeleteRequestId(null);
    }
  };

  React.useEffect(() => {
    let mounted = true;
    async function loadRequests() {
      try {
        const res = await api.requests.list({ limit: 100 });
        if (mounted && res && Array.isArray(res.requests)) {
          setRequests(res.requests.map(adaptRequestToFrontend));
        }
      } catch (err) {
        console.warn("Could not load admin requests:", err);
      }
    }
    loadRequests();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter logic
  const filteredRequests = React.useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "new") matchesTab = r.status === "pending";
      else if (activeTab === "quoted") matchesTab = r.status === "quoted";
      else if (activeTab === "in_progress")
        matchesTab = r.status === "in_progress" || r.status === "advance_paid";
      else if (activeTab === "completed")
        matchesTab = r.status === "completed" || r.status === "delivered";

      // Format filter
      let matchesFormat = true;
      if (formatFilter !== "all") {
        matchesFormat = r.format === formatFilter;
      }

      return matchesTab && matchesFormat;
    });
  }, [requests, activeTab, formatFilter]);

  const columns: Column<Request>[] = [
    {
      header: "Req ID",
      accessorKey: "id",
      className: "font-mono text-[12px] font-medium w-24",
      cell: (req) => (
        <span className="font-mono font-medium text-foreground">{req.id}</span>
      ),
    },
    {
      header: "Student",
      accessorKey: "studentName",
      cell: (req) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-[13px]">{req.studentName}</span>
          <span className="text-[11px] text-muted-foreground">{req.college} • Sem {req.semester}</span>
        </div>
      ),
    },
    {
      header: "Task & Subject",
      accessorKey: "title",
      cell: (req) => (
        <div className="flex flex-col max-w-sm">
          <span className="font-semibold text-foreground line-clamp-1 text-[13px]">
            {req.title}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {req.subject} • {req.pages} pages • {req.format}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (req) => <StatusBadge status={req.status} />,
    },
    {
      header: "Deadline",
      accessorKey: "deadline",
      cell: (req) => {
        const urgent = req.urgent || isDeadlineUrgent(req.deadline);
        return (
          <div className="flex items-center space-x-1.5 whitespace-nowrap">
            <span className="text-[12px] text-muted-foreground">{formatDate(req.deadline)}</span>
            {urgent && (
              <StatusBadge status="urgent" label="Urgent" className="text-[10px] py-0 px-1.5 h-4" />
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right w-48",
      cell: (req) => (
        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/chat/${req.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border px-2">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </Button>
          </Link>
          <Link href={`/admin/requests/${req.id}`}>
            <Button size="sm" className="h-8 text-[12px] font-medium px-2.5">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Review
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
            onClick={() => setDeleteRequestId(req.id)}
            title="Delete request from admin portal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Task Requests"
        description="Review student submissions, attached problem syllabi, issue official 50-50 milestone quotations, and manage fulfillment."
      />

      {/* Filter Bar: Status Tabs + Format Select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="h-10 border border-border bg-surface p-1 overflow-x-auto no-scrollbar max-w-full">
            <TabsTrigger value="all" className="text-[12px] shrink-0">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="new" className="text-[12px] shrink-0">New</TabsTrigger>
            <TabsTrigger value="quoted" className="text-[12px] shrink-0">Quoted</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-[12px] shrink-0">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="text-[12px] shrink-0">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2">
          <span className="text-[12px] text-muted-foreground flex items-center">
            <Filter className="h-3.5 w-3.5 mr-1" /> Format:
          </span>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-36 h-9 text-[12px] border-border bg-background">
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="typed">Typed PDF</SelectItem>
              <SelectItem value="handwritten">Handwritten</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 stroke-[1.5]" />}
          title="No requests match filters"
          description={`No submissions found under '${activeTab}' with format '${formatFilter}'.`}
        />
      ) : (
        <div className="cursor-pointer">
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search task title, student, or subject..."
            pageSize={6}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteRequestId)}
        onClose={() => setDeleteRequestId(null)}
        onConfirm={confirmDeleteRequest}
        title="Delete Request from Admin Portal?"
        description="This will remove this request from the admin portal. The student's portal record will remain unaffected."
        confirmLabel="Delete Request"
        cancelLabel="Keep Request"
        isDestructive={true}
      />
    </div>
  );
}
