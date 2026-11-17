"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Stepper } from "@/components/shared/Stepper";
import { DataTable, Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { mockRequests } from "@/lib/mock-data";
import { Request } from "@/types";
import { formatCurrencyINR, formatDate, isDeadlineUrgent } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Hourglass,
  IndianRupee,
  MessageSquare,
  ArrowRight,
  Plus,
  Lock,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function UserDashboardPage() {
  const router = useRouter();

  // Find nearest deadline request that needs action
  const activeRequest =
    mockRequests.find((r) => r.status === "ready" || r.status === "in_progress") ||
    mockRequests[0];

  // Calculate user stats
  const inProgressCount = mockRequests.filter(
    (r) => r.status === "in_progress" || r.status === "advance_paid"
  ).length;

  const completedCount = mockRequests.filter(
    (r) => r.status === "completed" || r.status === "delivered"
  ).length;

  const totalBalanceDue = mockRequests
    .filter((r) => r.balanceAmount && !r.balancePaid)
    .reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

  // Table columns
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
      header: "Task",
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
      header: "Action",
      className: "text-right w-28",
      cell: (req) => (
        <Link href={`/user/chat/${req.id}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px] border-border text-foreground hover:bg-surface"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Chat
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Student Dashboard"
        description="Welcome back, Aarav! Track your academic document orders, milestone approvals, and downloads."
        action={
          <Link href="/user/requests/new">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              New Request
            </Button>
          </Link>
        }
      />

      {/* Hero Card: Nearest Deadline & Action */}
      <Card className="border border-border bg-background rounded-[8px] p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Nearest Active Task • {activeRequest.id}
              </span>
              <StatusBadge status={activeRequest.status} />
              {activeRequest.urgent && (
                <StatusBadge status="urgent" label="Due in < 24 hrs" />
              )}
            </div>

            <h2 className="text-[26px] font-semibold tracking-tight text-foreground leading-snug">
              {activeRequest.title}
            </h2>

            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Subject: <strong className="text-foreground">{activeRequest.subject}</strong> ({activeRequest.pages} pages, {activeRequest.format}).
              {activeRequest.status === "ready" ? (
                <span> Document preparation complete. Pay the remaining 50% milestone to instantly unlock download.</span>
              ) : (
                <span> Specialist is actively working on Wireshark screenshots and program explanations.</span>
              )}
            </p>
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:items-end">
            <div className="text-left lg:text-right">
              <span className="text-[12px] text-muted-foreground block">
                Remaining Milestone
              </span>
              <span className="text-[26px] font-semibold text-foreground">
                {activeRequest.balanceAmount
                  ? formatCurrencyINR(activeRequest.balanceAmount)
                  : "₹0"}
              </span>
            </div>

            <Button
              size="lg"
              className="h-11 px-6 font-medium"
              onClick={() => {
                if (activeRequest.status === "ready") {
                  toast.success("Redirecting to Razorpay checkout for final milestone...");
                  router.push(`/user/payments`);
                } else {
                  router.push(`/user/chat/${activeRequest.id}`);
                }
              }}
            >
              {activeRequest.status === "ready" ? (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Pay & Download
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Task Discussion
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Stepper for Nearest Request */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted-foreground">
            <span>Milestone Progress Timeline</span>
            <span className="font-mono text-foreground">{activeRequest.id}</span>
          </div>
          <Stepper currentStatus={activeRequest.status} />
        </div>
      </Card>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Hourglass className="h-4 w-4" />}
          helperText="Active lab manuals & files being written"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          helperText="Delivered & unlocked assignments"
        />
        <StatCard
          label="Turnaround"
          value="24-48h"
          icon={<Clock className="h-4 w-4" />}
          helperText="Average delivery speed across tasks"
        />
        <StatCard
          label="Balance Due"
          value={formatCurrencyINR(totalBalanceDue)}
          icon={<IndianRupee className="h-4 w-4" />}
          helperText="Payable to unlock ready documents"
        />
      </div>

      {/* Recent Requests Table */}
      <Card className="border border-border bg-background rounded-[8px] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
              Recent Requests
            </h3>
            <p className="text-[14px] text-muted-foreground">
              Overview of all your college task orders and their live status
            </p>
          </div>
          <Link href="/user/requests">
            <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
              View All ({mockRequests.length})
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <DataTable
          data={mockRequests}
          columns={requestColumns}
          searchKey="title"
          searchPlaceholder="Search by subject or task..."
          pageSize={5}
        />
      </Card>
    </div>
  );
}
