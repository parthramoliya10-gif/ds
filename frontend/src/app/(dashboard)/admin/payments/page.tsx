"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment, Quotation, Request } from "@/types";
import api from "@/lib/api/client";
import { adaptPaymentToFrontend, adaptRequestToFrontend, adaptQuotationToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR, formatDate, formatDateTime, formatShortId } from "@/lib/utils";
import { downloadTaxInvoice } from "@/lib/invoice";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = React.useState("history");
  const [search, setSearch] = React.useState("");

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [quotations, setQuotations] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function loadAdminPayments() {
      try {
        setLoading(true);
        const [paymentsRes, requestsRes] = await Promise.allSettled([
          api.payments.adminList(),
          api.requests.list({ limit: 100 }),
        ]);

        if (mounted) {
          if (paymentsRes.status === "fulfilled" && Array.isArray(paymentsRes.value)) {
            setPayments(paymentsRes.value.map(adaptPaymentToFrontend));
          }
          if (requestsRes.status === "fulfilled" && Array.isArray(requestsRes.value?.requests)) {
            const adapted = requestsRes.value.requests.map(adaptRequestToFrontend);
            setRequests(adapted);
            const quotes: Quotation[] = [];
            requestsRes.value.requests.forEach((r: any) => {
              if (r.quotations && r.quotations.length > 0) {
                quotes.push(...r.quotations.map(adaptQuotationToFrontend));
              }
            });
            setQuotations(quotes);
          }
        }
      } catch (err) {
        console.warn("Could not load backend admin payments:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAdminPayments();
    return () => {
      mounted = false;
    };
  }, []);

  // Request milestone summaries
  const requestMilestones = requests.map((req) => {
    const quote = quotations.find((q) => q.requestId === req.id);
    const totalAmount = quote ? quote.amount : (req.totalAmount || 0);
    const advanceAmount = quote ? quote.advanceAmount : (req.advanceAmount || Math.round(totalAmount / 2));
    const balanceAmount = quote ? quote.remainingAmount : (req.balanceAmount || totalAmount - advanceAmount);

    return {
      id: req.id,
      title: req.title,
      studentName: req.studentName,
      college: req.college,
      totalAmount,
      advanceAmount,
      balanceAmount,
      advancePaid: req.advancePaid,
      balancePaid: req.balancePaid,
      status: req.status,
    };
  });

  // Calculate totals
  const totalRevenueCollected = payments
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingMilestoneBalances = requestMilestones
    .filter((r) => r.advancePaid && !r.balancePaid)
    .reduce((acc, r) => acc + r.balanceAmount, 0);

  const totalQuotationsValue = quotations.reduce((acc, q) => acc + q.amount, 0);
  const realizationRate = requests.length > 0
    ? `${Math.min(100, Math.round((payments.filter((p) => p.status === "completed").length / (requests.length * 2 || 1)) * 100))}%`
    : "100%";

  // Filtered lists
  const filteredTransactions = payments.filter(
    (t) =>
      (t.transactionId || "").toLowerCase().includes(search.toLowerCase()) ||
      t.requestId.toLowerCase().includes(search.toLowerCase()) ||
      (t.requestTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuotations = quotations.filter(
    (q) =>
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.requestId.toLowerCase().includes(search.toLowerCase()) ||
      (q.notes && q.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredMilestones = requestMilestones.filter(
    (m) =>
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csvHeader = "Transaction ID,Request ID,Task Title,Student,Milestone,Amount (USD),Status,Date\n";
    const csvRows = payments
      .map(
        (t) =>
          `"${t.transactionId || t.id}","${t.requestId}","${t.requestTitle || t.requestId}","${t.studentId || "Student"}","${t.milestone} 50%",${t.amount},"${t.status}","${t.paidAt || new Date().toISOString()}"`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DSMS_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Financial ledger exported to CSV successfully.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-foreground">
            Financial Ledger & Milestone Auditing
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Track student Razorpay transaction logs, 50-50 milestone splits, escrow status, and fiscal audit reports.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="h-9 text-[13px] font-semibold shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Ledger (CSV)
        </Button>
      </div>

      {/* Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue Collected"
          value={formatCurrencyINR(totalRevenueCollected)}
          helperText="Cleared through Razorpay"
          icon={<DollarSign className="h-4 w-4 stroke-[1.75]" />}
        />
        <StatCard
          label="Pending Milestone Escrow"
          value={formatCurrencyINR(pendingMilestoneBalances)}
          helperText="Awaiting final delivery unlock"
          icon={<Clock className="h-4 w-4 stroke-[1.75]" />}
        />
        <StatCard
          label="Total Quotations Dispatched"
          value={formatCurrencyINR(totalQuotationsValue)}
          helperText={`${quotations.length} milestone quotes issued`}
          icon={<ShieldCheck className="h-4 w-4 stroke-[1.75]" />}
        />
        <StatCard
          label="Milestone Realization"
          value={realizationRate}
          helperText="Completion-to-payment rate"
          icon={<TrendingUp className="h-4 w-4 stroke-[1.75]" />}
        />
      </div>

      {/* Main Tabs Section */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full min-w-0">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
            <TabsList className="bg-surface border border-border h-10 max-w-full flex items-center justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="history" className="text-[13px] px-3 shrink-0">
                Transaction History ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="quotations" className="text-[13px] px-3 shrink-0">
                Quotations Table ({quotations.length})
              </TabsTrigger>
              <TabsTrigger value="milestones" className="text-[13px] px-3 shrink-0">
                Milestone Status Per Request
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Txn ID, task or code..."
                className="pl-8 h-9 text-[13px] bg-background border-border"
              />
            </div>
          </div>

          {/* TAB 1: Transaction History */}
          <TabsContent value="history" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Transaction ID</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Request ID & Title</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Milestone</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Method</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Date & Time</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-[13px]">
                        No transaction records found matching &quot;{search}&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <TableRow key={txn.id} className="border-border hover:bg-surface/50">
                        <TableCell className="font-mono text-[12px] font-medium text-foreground">
                          {formatShortId(txn.transactionId || txn.id, "TXN")}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <Link
                            href={`/admin/requests/${txn.requestId}`}
                            className="font-medium text-[13px] text-foreground hover:underline line-clamp-1"
                          >
                            {formatShortId(txn.requestId, "REQ")} • {txn.requestTitle}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={txn.milestone === "advance" ? "outline" : "boldBorder"}
                            className="text-[10px] capitalize"
                          >
                            {txn.milestone === "advance" ? "50% Advance" : "50% Final"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground font-mono">
                          UPI / Netbanking
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-[13px] text-foreground">
                          {formatCurrencyINR(txn.amount)}
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground whitespace-nowrap">
                          {txn.paidAt ? formatDateTime(txn.paidAt) : "Recently"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-foreground text-background">
                            <Check className="h-2.5 w-2.5 mr-1" />
                            Success
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const matchingReq = requests.find((r) => r.id === txn.requestId);
                              downloadTaxInvoice(txn, {
                                studentName: matchingReq?.studentName,
                                college: matchingReq?.college,
                                taskTitle: matchingReq?.title || txn.requestTitle,
                                subject: matchingReq?.subject,
                              });
                              toast.success(`Generated tax invoice for ${formatShortId(txn.transactionId || txn.id, "TXN")}`);
                            }}
                            className="h-7 text-[11px] border-border"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: Quotations Table */}
          <TabsContent value="quotations" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Quotation ID</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Task / Request</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Total Fee</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">50% Advance</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">50% Balance</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Turnaround</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-[13px]">
                        No quotation records found matching &quot;{search}&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quote) => (
                      <TableRow key={quote.id} className="border-border hover:bg-surface/50">
                        <TableCell className="font-mono text-[12px] font-bold text-foreground">
                          {formatShortId(quote.id, "QT")}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <Link
                            href={`/admin/requests/${quote.requestId}`}
                            className="font-medium text-[13px] text-foreground hover:underline"
                          >
                            {formatShortId(quote.requestId, "REQ")}
                          </Link>
                          {quote.notes && (
                            <p className="text-[11px] text-muted-foreground truncate">{quote.notes}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[14px] text-foreground">
                          {formatCurrencyINR(quote.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] text-foreground">
                          {formatCurrencyINR(quote.advanceAmount)}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] text-foreground">
                          {formatCurrencyINR(quote.remainingAmount)}
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">
                          {quote.estimatedDelivery}
                        </TableCell>
                        <TableCell>
                          {quote.status === "accepted" ? (
                            <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-foreground text-background">
                              Accepted
                            </Badge>
                          ) : quote.status === "pending" ? (
                            <Badge variant="boldBorder" className="text-[10px] py-0 px-1.5 h-4">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                              {quote.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/requests/${quote.requestId}`}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-border">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Inspect
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 3: Milestone Status Per Request */}
          <TabsContent value="milestones" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Task / Student</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Milestone 1 (50% Advance)</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Milestone 2 (50% Balance)</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Total Value</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground">Escrow Status</TableHead>
                    <TableHead className="text-[12px] font-semibold text-muted-foreground text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMilestones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-[13px]">
                        No tasks found matching &quot;{search}&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMilestones.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-surface/50">
                        <TableCell className="max-w-sm">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {formatShortId(item.id, "REQ")} • {item.studentName} ({item.college})
                            </span>
                            <h5 className="font-semibold text-[13px] text-foreground line-clamp-1">
                              {item.title}
                            </h5>
                          </div>
                        </TableCell>

                        {/* Milestone 1 Advance */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.advancePaid ? (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-foreground text-background">
                                <Check className="h-2.5 w-2.5 mr-1" />
                                Paid ({formatCurrencyINR(item.advanceAmount)})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-muted-foreground">
                                Pending ({formatCurrencyINR(item.advanceAmount)})
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Milestone 2 Balance */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.balancePaid ? (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-foreground text-background">
                                <Check className="h-2.5 w-2.5 mr-1" />
                                Paid ({formatCurrencyINR(item.balanceAmount)})
                              </Badge>
                            ) : (
                              <Badge variant="boldBorder" className="text-[10px] py-0 px-1.5 h-4">
                                Locked ({formatCurrencyINR(item.balanceAmount)})
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Total Value */}
                        <TableCell className="font-mono font-bold text-[14px] text-foreground">
                          {formatCurrencyINR(item.totalAmount)}
                        </TableCell>

                        {/* Escrow Status */}
                        <TableCell>
                          <StatusBadge status={item.status} className="text-[10px] py-0 px-1.5 h-4" />
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/admin/requests/${item.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-border">
                              Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
