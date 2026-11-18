"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Stepper } from "@/components/shared/Stepper";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useAuth } from "@/context/AuthContext";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate, isDeadlineUrgent } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Hourglass,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Plus,
  Lock,
  Unlock,
  Download,
  AlertTriangle,
  FileText,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Zap,
  FolderDown,
  Eye,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Search & view mode states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function loadDashboardRequests() {
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
    loadDashboardRequests();
    return () => {
      mounted = false;
    };
  }, []);

  // Find nearest deadline request that is currently in progress
  const activeRequest =
    requests.find((r) => r.status === "in_progress") ||
    requests.find((r) => r.status === "ready" || r.status === "document_uploaded") ||
    requests[0];

  // Find requests that are ready for final payment & download unlock
  const readyRequests = requests.filter(
    (r) => r.status === "ready" || r.status === "document_uploaded"
  );

  // Calculate user stats
  const inProgressCount = requests.filter(
    (r) => r.status === "in_progress" || r.status === "advance_paid"
  ).length;

  const readyCount = readyRequests.length;

  const completedCount = requests.filter(
    (r) => r.status === "completed" || r.status === "delivered"
  ).length;

  const totalBalanceDue = requests
    .filter((r) => r.balanceAmount && !r.balancePaid)
    .reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

  // Filter requests based on tab and search
  const filteredRequests = React.useMemo(() => {
    return requests.filter((req) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "in_progress") {
        matchesTab = req.status === "in_progress" || req.status === "advance_paid";
      } else if (activeTab === "ready") {
        matchesTab = req.status === "ready" || req.status === "document_uploaded";
      } else if (activeTab === "quoted") {
        matchesTab = req.status === "quoted" || req.status === "pending";
      } else if (activeTab === "completed") {
        matchesTab = req.status === "completed" || req.status === "delivered";
      }

      // Search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, searchQuery]);

  // Table columns for Table View
  const requestColumns: Column<Request>[] = [
    {
      header: "Req ID",
      accessorKey: "id",
      className: "font-mono text-[12px] font-medium w-24",
      cell: (req) => (
        <Link
          href={`/user/requests/${req.id}`}
          className="hover:underline font-mono font-medium text-foreground"
        >
          {req.id}
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
      header: "Milestone Due",
      accessorKey: "balanceAmount",
      cell: (req) => (
        <span className="text-[13px] font-medium text-foreground">
          {req.balanceAmount && !req.balancePaid
            ? formatCurrencyINR(req.balanceAmount)
            : req.status === "completed"
            ? "Paid in Full"
            : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-36",
      cell: (req) => (
        <div className="flex items-center justify-end space-x-1.5">
          {req.status === "ready" ? (
            <Link href="/user/payments">
              <Button size="sm" className="h-8 text-[12px] px-2.5">
                <Download className="h-3.5 w-3.5 mr-1" />
                Pay & Unlock
              </Button>
            </Link>
          ) : (
            <Link href={`/user/chat/${req.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] border-border text-foreground hover:bg-surface px-2.5"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Chat
              </Button>
            </Link>
          )}
          <Link href={`/user/requests/${req.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Status Header Banner */}
      <div className="rounded-[10px] border border-border bg-background p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[12px] text-muted-foreground font-mono block">
              {user?.college || "University Student Portal"}
            </span>

            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              Welcome back, {user?.name || "Student"}!
            </h1>

            <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
              Track your academic lab manuals, assignments, milestone escrow payments, and unlock completed files.
            </p>

            {/* Quick alert badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center text-[12px] px-2.5 py-1 rounded-md bg-surface border border-border text-foreground">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-foreground" />
                1 Task Due Within 24h
              </span>
              {readyCount > 0 && (
                <span className="inline-flex items-center text-[12px] px-2.5 py-1 rounded-md border-2 border-foreground font-semibold text-foreground bg-background">
                  <Unlock className="h-3.5 w-3.5 mr-1.5" />
                  {readyCount} Document Ready to Unlock
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link href="/user/documents">
              <Button
                variant="outline"
                className="h-10 px-4 text-[13px] border-border text-foreground hover:bg-surface rounded-[8px]"
              >
                <FolderDown className="h-4 w-4 mr-2" />
                My Documents
              </Button>
            </Link>
            <Link href="/user/requests/new">
              <Button className="h-10 px-4 text-[13px] font-medium rounded-[8px]">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Action Required Callout Banner (If any document is ready to unlock) */}
      {readyRequests.length > 0 && (
        <div className="rounded-[10px] border-2 border-foreground bg-surface p-5 sm:p-6 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-foreground text-background font-semibold text-[11px] px-2.5 py-0.5">
                  Action Required
                </Badge>
                <span className="text-[12px] font-mono text-muted-foreground">
                  {readyRequests[0].id}
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
                Final Document Ready for Download: {readyRequests[0].title}
              </h3>

              <p className="text-[13px] text-muted-foreground max-w-2xl leading-relaxed">
                Academic specialist has completed all {readyRequests[0].pages} pages with standard formatting. Pay the remaining 50% milestone ({formatCurrencyINR(readyRequests[0].balanceAmount || 900)}) to instantly unlock the original PDF file.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="text-left sm:text-right mr-2">
                <span className="text-[11px] text-muted-foreground block uppercase font-mono tracking-wider">
                  Remaining 50%
                </span>
                <span className="text-[20px] font-bold text-foreground">
                  {formatCurrencyINR(readyRequests[0].balanceAmount || 900)}
                </span>
              </div>

              <Button
                size="lg"
                className="h-10 px-5 text-[13px] font-semibold rounded-[8px]"
                onClick={() => {
                  toast.success("Redirecting to Razorpay checkout for final milestone...");
                  router.push("/user/payments");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Pay & Unlock Download
              </Button>

              <Link href={`/user/chat/${readyRequests[0].id}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-10 px-4 text-[13px] border-border text-foreground hover:bg-background rounded-[8px]"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Featured Active Task Spotlight (Hero Card) */}
      {activeRequest ? (
        <Card className="border border-border bg-background rounded-[10px] p-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Nearest Active Task • {activeRequest.id}
                </span>
                <StatusBadge status={activeRequest.status} />
                {activeRequest.urgent && (
                  <StatusBadge status="urgent" label="Due in < 24 hrs" />
                )}
                <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-border bg-surface text-foreground">
                  {activeRequest.subject}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {activeRequest.pages} pages • {activeRequest.format}
                </span>
              </div>

              {/* Task Title */}
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-foreground leading-snug">
                {activeRequest.title}
              </h2>

              {/* Specialist Status Box */}
              <div className="rounded-[8px] border border-border bg-surface p-3.5 flex items-start space-x-3 text-[13px]">
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                  WR
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Specialist Drafting in Progress
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Active specialist is currently documenting Wireshark packet capture analysis, program screenshots, and verification code.
                  </p>
                </div>
              </div>

              {/* Escrow Milestone Strip */}
              <div className="grid grid-cols-3 gap-3 pt-1 text-[12px]">
                <div className="p-2.5 rounded-[6px] border border-border bg-surface/50">
                  <span className="text-muted-foreground block text-[11px]">Total Price</span>
                  <span className="font-semibold text-foreground text-[14px]">
                    {formatCurrencyINR(activeRequest.totalAmount || 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-[6px] border border-border bg-surface/50">
                  <span className="text-muted-foreground block text-[11px]">50% Advance Paid</span>
                  <span className="font-semibold text-foreground text-[14px]">
                    {formatCurrencyINR(activeRequest.advanceAmount || 0)} {activeRequest.advancePaid ? "✓" : ""}
                  </span>
                </div>
                <div className="p-2.5 rounded-[6px] border border-border bg-surface/50">
                  <span className="text-muted-foreground block text-[11px]">Remaining Milestone</span>
                  <span className="font-semibold text-foreground text-[14px]">
                    {formatCurrencyINR(activeRequest.balanceAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action column */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:items-end lg:min-w-[200px]">
              <div className="text-left lg:text-right">
                <span className="text-[11px] uppercase font-mono tracking-wider text-muted-foreground block">
                  Target Deadline
                </span>
                <span className="text-[18px] font-bold text-foreground">
                  {formatDate(activeRequest.deadline)}
                </span>
                <span className="text-[12px] text-muted-foreground block mt-0.5">
                  Turnaround: Under 24h
                </span>
              </div>

              <Button
                size="lg"
                className="h-11 px-6 font-semibold rounded-[8px] w-full sm:w-auto"
                onClick={() => router.push(`/user/chat/${activeRequest.id}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Task Discussion
              </Button>

              <Link href={`/user/requests/${activeRequest.id}`} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full border-border text-foreground hover:bg-surface rounded-[8px] text-[12px]"
                >
                  View Request Details
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Milestone Stepper */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="mb-3 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span>Milestone Progress Timeline</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-surface border border-border text-foreground">
                  Active Lifecycle
                </span>
              </span>
              <span className="font-mono text-foreground font-semibold">{activeRequest.id}</span>
            </div>
            <Stepper currentStatus={activeRequest.status} />
          </div>
        </Card>
      ) : (
        <Card className="border border-border bg-background rounded-[10px] p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h2 className="text-[20px] font-bold text-foreground">Welcome to DSMS Academic Portal</h2>
              <p className="text-[13px] text-muted-foreground">
                Get started by creating your first document request. Receive guaranteed milestone protection and rapid turnaround.
              </p>
            </div>
            <Link href="/user/requests/new">
              <Button className="h-10 px-5 font-semibold shrink-0">
                <Plus className="h-4 w-4 mr-1.5" />
                Submit New Task
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4. Executive Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="p-5 border border-border bg-background rounded-[10px] hover:border-foreground/40 transition-colors cursor-pointer"
          onClick={() => setActiveTab("in_progress")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              In Progress
            </span>
            <div className="h-8 w-8 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[28px] font-bold tracking-tight text-foreground">
            {inProgressCount}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Active lab manuals & practical files
          </p>
        </Card>

        <Card
          className="p-5 border border-border bg-background rounded-[10px] hover:border-foreground/40 transition-colors cursor-pointer"
          onClick={() => setActiveTab("ready")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Ready to Unlock
            </span>
            <div className="h-8 w-8 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground">
              <Unlock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[28px] font-bold tracking-tight text-foreground">
            {readyCount}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Completed document waiting for payment
          </p>
        </Card>

        <Card
          className="p-5 border border-border bg-background rounded-[10px] hover:border-foreground/40 transition-colors cursor-pointer"
          onClick={() => setActiveTab("completed")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Delivered
            </span>
            <div className="h-8 w-8 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[28px] font-bold tracking-tight text-foreground">
            {completedCount}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            100% verified & unlocked assignments
          </p>
        </Card>

        <Card
          className="p-5 border border-border bg-background rounded-[10px] hover:border-foreground/40 transition-colors cursor-pointer"
          onClick={() => router.push("/user/payments")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Escrow Balance
            </span>
            <div className="h-8 w-8 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-[28px] font-bold tracking-tight text-foreground">
            {formatCurrencyINR(totalBalanceDue)}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Payable to unlock ready documents
          </p>
        </Card>
      </div>

      {/* 5. Recent Requests Hub (Search, Filter Tabs, Dual View) */}
      <Card className="border border-border bg-background rounded-[10px] p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
              My Academic Requests
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Monitor milestones, chat with assigned specialists, and unlock downloads.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-[8px] p-0.5 bg-surface shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Link href="/user/requests" className="shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-[12px] border-border text-foreground hover:bg-surface">
                View All ({requests.length})
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls: Tabs & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto max-w-full min-w-0">
            <TabsList className="w-full sm:w-auto max-w-full flex items-center justify-start overflow-x-auto no-scrollbar h-10 border border-border bg-surface p-1">
              <TabsTrigger value="all" className="text-[12px] px-3 shrink-0">
                All ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-[12px] px-3 shrink-0">
                In Progress ({inProgressCount})
              </TabsTrigger>
              <TabsTrigger value="ready" className="text-[12px] px-3 shrink-0">
                Ready to Unlock ({readyCount})
              </TabsTrigger>
              <TabsTrigger value="quoted" className="text-[12px] px-3 shrink-0">
                Pending Quote
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-[12px] px-3 shrink-0">
                Completed ({completedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by subject, task or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-[13px] border-border bg-surface rounded-[8px]"
            />
          </div>
        </div>

        {/* Empty state when no matches */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-[8px] bg-surface/30">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3 stroke-[1.5]" />
            <h4 className="text-[15px] font-semibold text-foreground">No matching requests found</h4>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-sm mx-auto">
              No tasks matched your search query or selected filter tab. Try clearing the filter or search term.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("all");
                setSearchQuery("");
              }}
              className="mt-4 h-8 text-[12px] border-border"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => {
              const urgent = req.urgent || isDeadlineUrgent(req.deadline);
              return (
                <div
                  key={req.id}
                  className="rounded-[8px] border border-border bg-surface/40 p-4 flex flex-col justify-between hover:border-foreground/30 transition-all space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Top status & ID */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {req.id}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    {/* Title */}
                    <Link
                      href={`/user/requests/${req.id}`}
                      className="font-semibold text-[15px] text-foreground hover:underline line-clamp-2 block leading-snug"
                    >
                      {req.title}
                    </Link>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-medium">
                        {req.subject}
                      </span>
                      <span>•</span>
                      <span>{req.pages} pages</span>
                      <span>•</span>
                      <span className="capitalize">{req.format}</span>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center space-x-2 text-[12px] pt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(req.deadline)}
                      </span>
                      {urgent && (
                        <StatusBadge status="urgent" label="Urgent" className="text-[10px] py-0 px-1.5 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Financial & Action footer */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                        {req.status === "ready" ? "Balance Due" : req.status === "completed" ? "Total Paid" : "Est. Total"}
                      </span>
                      <span className="text-[14px] font-bold text-foreground">
                        {req.status === "ready" && req.balanceAmount
                          ? formatCurrencyINR(req.balanceAmount)
                          : req.totalAmount
                          ? formatCurrencyINR(req.totalAmount)
                          : "Awaiting Quote"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {req.status === "ready" ? (
                        <Link href="/user/payments">
                          <Button size="sm" className="h-8 text-[12px] px-3 font-semibold">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Unlock
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/user/chat/${req.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[12px] px-3 border-border text-foreground hover:bg-background"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Chat
                          </Button>
                        </Link>
                      )}
                      <Link href={`/user/requests/${req.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <DataTable
            data={filteredRequests}
            columns={requestColumns}
            searchKey="title"
            searchPlaceholder="Filter table rows..."
            pageSize={5}
          />
        )}
      </Card>

      {/* 7. Live Activity Feed & Safety Guarantee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Milestone Notifications */}
        <Card className="lg:col-span-2 border border-border bg-background rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-foreground">
              Recent Order Updates & Milestones
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-[13px] text-muted-foreground p-3">No recent order updates.</p>
            ) : (
              requests.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  href={`/user/requests/${r.id}`}
                  className="flex items-start space-x-3 p-3 rounded-[8px] border border-border bg-surface/40 hover:bg-surface transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {r.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                        {formatDate(r.updatedAt || r.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                      Status: {r.status.toUpperCase()} • {r.format} ({r.pages} pages)
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Academic Trust & Safety */}
        <Card className="border border-border bg-background rounded-[10px] p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-foreground">
              <ShieldCheck className="h-5 w-5" />
              <h4 className="text-[15px] font-semibold tracking-tight">
                Student Escrow Guarantee
              </h4>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Your payments are protected in milestone escrow. Specialists receive the final 50% only after you download, review, and approve your academic document.
            </p>
            <ul className="text-[12px] text-foreground space-y-1.5 pt-1">
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-2 text-foreground shrink-0" />
                100% Plagiarism-Free Standards
              </li>
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-2 text-foreground shrink-0" />
                Unlimited Formatting Corrections
              </li>
              <li className="flex items-center">
                <Check className="h-3.5 w-3.5 mr-2 text-foreground shrink-0" />
                Instant Watermark Removal upon Payment
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/user/chat">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[12px] h-8 border-border text-foreground hover:bg-surface"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Contact Helpdesk
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
