"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatDate, isDeadlineUrgent, formatShortId } from "@/lib/utils";
import { Plus, MessageSquare, Eye, FileText, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

export default function UserRequestsListPage() {
  const [activeTab, setActiveTab] = React.useState("all");
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteRequestId, setDeleteRequestId] = React.useState<string | null>(null);

  const confirmDeleteRequest = async () => {
    if (!deleteRequestId) return;
    try {
      await api.requests.delete(deleteRequestId);
      setRequests((prev) => prev.filter((r) => r.id !== deleteRequestId));
      toast.success("Request deleted from your account");
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
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          const adapted = res.requests.map(adaptRequestToFrontend);
          setRequests(adapted);
        }
      } catch (err) {
        console.warn("Could not load backend requests:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadRequests();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter based on tab
  const filteredRequests = React.useMemo(() => {
    switch (activeTab) {
      case "in_progress":
        return requests.filter(
          (r) => r.status === "in_progress" || r.status === "advance_paid"
        );
      case "pending":
        return requests.filter(
          (r) => r.status === "pending" || r.status === "quoted"
        );
      case "ready":
        return requests.filter(
          (r) => r.status === "ready" || r.status === "document_uploaded"
        );
      case "completed":
        return requests.filter(
          (r) => r.status === "completed" || r.status === "delivered"
        );
      case "all":
      default:
        return requests;
    }
  }, [requests, activeTab]);

  const columns: Column<Request>[] = [
    {
      header: "Req ID",
      accessorKey: "id",
      className: "font-mono text-[12px] font-medium w-24",
      cell: (req) => (
        <Link
          href={`/user/requests/${req.id}`}
          className="hover:underline font-mono font-medium text-foreground"
        >
          {formatShortId(req.id, "REQ")}
        </Link>
      ),
    },
    {
      header: "Task & Subject",
      accessorKey: "title",
      cell: (req) => (
        <div className="flex flex-col max-w-md">
          <Link
            href={`/user/requests/${req.id}`}
            className="font-semibold text-foreground hover:underline line-clamp-1"
          >
            {req.title}
          </Link>
          <span className="text-[12px] text-muted-foreground">
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
          <div className="flex items-center space-x-2">
            <span className="text-[13px] text-muted-foreground whitespace-nowrap">
              {formatDate(req.deadline)}
            </span>
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
          <Link href={`/user/chat/${req.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px] border-border text-foreground hover:bg-surface px-2.5"
              title="Open Chat"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </Button>
          </Link>
          <Link href={`/user/requests/${req.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[12px] border-border text-foreground hover:bg-surface px-2.5"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Details
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
            onClick={() => setDeleteRequestId(req.id)}
            title="Delete request from my account"
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
        title="My Requests"
        description="Track all your organization assignments, lab manuals, and reports from submission to download unlock."
        action={
          <Link href="/user/requests/new">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Request
            </Button>
          </Link>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="h-10 border border-border bg-surface p-1 overflow-x-auto no-scrollbar max-w-full">
            <TabsTrigger value="all" className="text-[12px] shrink-0">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-[12px] shrink-0">In Progress</TabsTrigger>
            <TabsTrigger value="pending" className="text-[12px] shrink-0">Pending Quote</TabsTrigger>
            <TabsTrigger value="ready" className="text-[12px] shrink-0">Ready for Download</TabsTrigger>
            <TabsTrigger value="completed" className="text-[12px] shrink-0">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Requests Data Table or Empty State */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 stroke-[1.5]" />}
          title="No requests found"
          description={`There are currently no tasks in the '${activeTab}' category. Click below to submit a new task.`}
          action={
            <Link href="/user/requests/new">
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1.5" />
                Submit a Task Request
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          data={filteredRequests}
          columns={columns}
          searchKey="title"
          searchPlaceholder="Search by task title or subject..."
          pageSize={6}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteRequestId)}
        onClose={() => setDeleteRequestId(null)}
        onConfirm={confirmDeleteRequest}
        title="Delete Request?"
        description="This will permanently delete and remove this request from your account. The specialist desk record will not be affected."
        confirmLabel="Delete Request"
        cancelLabel="Keep Request"
        isDestructive={true}
      />
    </div>
  );
}
