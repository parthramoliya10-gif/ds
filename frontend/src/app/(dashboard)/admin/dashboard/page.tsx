"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RevenueLineChart } from "@/components/admin/RevenueLineChart";
import { WeeklyRequestsBarChart } from "@/components/admin/WeeklyRequestsBarChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Request } from "@/types";
import api from "@/lib/api/client";
import { adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate, isDeadlineUrgent } from "@/lib/utils";
import {
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingUp,
  BarChart3,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadAdminDashboard() {
      try {
        const [statsRes, requestsRes] = await Promise.allSettled([
          api.admin.getDashboardStats(),
          api.requests.list({ limit: 50 }),
        ]);

        if (mounted) {
          if (statsRes.status === "fulfilled" && statsRes.value) {
            setStats(statsRes.value);
          }
          if (requestsRes.status === "fulfilled" && Array.isArray(requestsRes.value?.requests)) {
            setRequests(requestsRes.value.requests.map(adaptRequestToFrontend));
          }
        }
      } catch (err) {
        console.warn("Could not load admin dashboard data:", err);
      }
    }
    loadAdminDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  // Metrics
  const totalRequests = stats?.requests?.total ?? stats?.totalRequests ?? requests.length;
  const newRequests = stats?.requests?.pending ?? stats?.pendingRequests ?? requests.filter((r) => r.status === "pending").length;
  const revenueThisMonth = stats?.finances?.totalRevenue?.dollars ?? (stats?.totalRevenue ? Math.round(stats.totalRevenue / 100) : 0);
  const pendingPayments = stats?.finances?.pendingRevenue?.dollars ?? requests
    .filter((r) => r.balanceAmount && !r.balancePaid)
    .reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

  // Weekly requests distribution
  const weeklyData = React.useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
    requests.forEach((r) => {
      const d = new Date(r.createdAt || r.deadline);
      const dayName = days[d.getDay()];
      if (dayName && counts[dayName] !== undefined) {
        counts[dayName]++;
      }
    });
    return [
      { day: "Mon", requests: counts.Mon },
      { day: "Tue", requests: counts.Tue },
      { day: "Wed", requests: counts.Wed },
      { day: "Thu", requests: counts.Thu },
      { day: "Fri", requests: counts.Fri },
      { day: "Sat", requests: counts.Sat },
      { day: "Sun", requests: counts.Sun },
    ];
  }, [requests]);

  // "Needs attention" list sorted by nearest deadline
  const needsAttention = React.useMemo(() => {
    return [...requests]
      .filter((r) => r.status !== "completed" && r.status !== "delivered")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [requests]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Operations Command"
        description="Monitor university task submissions, turnaround metrics, 50-50 milestone revenue, and active student inquiries."
        action={
          <Link href="/admin/requests">
            <Button size="sm" className="h-9">
              Review All Requests
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Requests"
          value={totalRequests}
          icon={<FileText className="h-4 w-4" />}
          helperText="All university tasks received to date"
        />
        <StatCard
          label="New Submissions"
          value={newRequests}
          icon={<AlertCircle className="h-4 w-4" />}
          helperText="Awaiting initial quotation dispatch"
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrencyINR(revenueThisMonth)}
          icon={<DollarSign className="h-4 w-4" />}
          helperText="Advance deposits + completion releases"
        />
        <StatCard
          label="Pending Payments"
          value={formatCurrencyINR(pendingPayments)}
          icon={<Clock className="h-4 w-4" />}
          helperText="Remaining 50% locked milestones"
        />
      </div>

      {/* Charts Grid: Revenue Line Chart & Weekly Requests Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-2">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[16px] font-semibold text-foreground tracking-tight flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Monthly Revenue Trend
              </CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground mt-0.5">
                Gross milestone settlements (USD) over the last 6 months
              </CardDescription>
            </div>
            <span className="text-[14px] font-bold text-foreground">
              {formatCurrencyINR(revenueThisMonth)} (Nov)
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <RevenueLineChart />
          </CardContent>
        </Card>

        {/* Weekly Requests Bar Chart */}
        <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-2">
          <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[16px] font-semibold text-foreground tracking-tight flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Weekly Request Inflow
              </CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground mt-0.5">
                Daily student assignment submissions across colleges
              </CardDescription>
            </div>
            <span className="text-[14px] font-bold text-foreground">
              {requests.length} Total Tasks
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <WeeklyRequestsBarChart data={weeklyData} />
          </CardContent>
        </Card>
      </div>

      {/* "Needs Attention" List sorted by nearest deadline */}
      <Card className="border border-border bg-background rounded-[8px] p-5 shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
          <div>
            <h3 className="text-[18px] font-semibold text-foreground tracking-tight flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Needs Attention (Nearest Deadlines)
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Prioritized by submission deadline and action status
            </p>
          </div>
          <span className="text-[12px] font-mono text-muted-foreground">
            {needsAttention.length} Pending Actions
          </span>
        </div>

        {needsAttention.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            title="All caught up"
            description="No requests currently require immediate attention."
          />
        ) : (
          <div className="divide-y divide-border">
            {needsAttention.map((req) => {
              const urgent = req.urgent || isDeadlineUrgent(req.deadline);

              return (
                <div
                  key={req.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] hover:bg-surface/50 transition-colors rounded-[6px] px-2"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[12px] font-medium text-muted-foreground">
                        {req.id}
                      </span>
                      <StatusBadge status={req.status} className="text-[10px] py-0 px-1.5 h-4" />
                      {urgent && (
                        <StatusBadge status="urgent" label="Urgent (<24h)" className="text-[10px] py-0 px-1.5 h-4" />
                      )}
                    </div>
                    <h4 className="text-[14px] font-semibold text-foreground line-clamp-1">
                      {req.title}
                    </h4>
                    <p className="text-[12px] text-muted-foreground">
                      Student: <strong className="text-foreground">{req.studentName}</strong> ({req.college}) • {req.pages} pages ({req.format})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right mr-2 hidden md:block">
                      <span className="text-[11px] text-muted-foreground block">Deadline</span>
                      <span className="text-[12px] font-medium text-foreground whitespace-nowrap">
                        {formatDate(req.deadline)}
                      </span>
                    </div>

                    <Link href={`/admin/chat/${req.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-[12px] border-border">
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />
                        Chat
                      </Button>
                    </Link>

                    <Link href={`/admin/requests/${req.id}`}>
                      <Button size="sm" className="h-8 text-[12px] font-medium">
                        Review & Quote
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
