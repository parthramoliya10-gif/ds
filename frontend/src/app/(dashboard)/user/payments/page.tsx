"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { MilestoneProgressBar } from "@/components/payments/MilestoneProgressBar";
import { RazorpayModal } from "@/components/payments/RazorpayModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPayments, mockRequests } from "@/lib/mock-data";
import { Payment } from "@/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  CreditCard,
  IndianRupee,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

export default function UserPaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>(mockPayments);
  const [isRazorpayOpen, setIsRazorpayOpen] = React.useState(false);

  // Financial calculations
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOutstanding = mockRequests
    .filter((r) => r.balanceAmount && !r.balancePaid)
    .reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

  const totalBilled = totalPaid + totalOutstanding;

  const handleDownloadInvoice = (payment: Payment) => {
    toast.success(`Downloading tax invoice for ${payment.transactionId || payment.id}...`);
  };

  const paymentColumns: Column<Payment>[] = [
    {
      header: "Txn ID",
      accessorKey: "transactionId",
      className: "font-mono text-[12px] font-medium w-36",
      cell: (p) => p.transactionId || p.id,
    },
    {
      header: "Task & Description",
      accessorKey: "requestTitle",
      cell: (p) => (
        <div className="flex flex-col">
          <Link
            href={`/user/requests/${p.requestId}`}
            className="font-semibold text-foreground hover:underline line-clamp-1"
          >
            {p.requestTitle || p.requestId}
          </Link>
          <span className="text-[12px] text-muted-foreground font-mono">
            {p.requestId}
          </span>
        </div>
      ),
    },
    {
      header: "Milestone",
      accessorKey: "milestone",
      cell: (p) => (
        <Badge
          variant={p.milestone === "advance" ? "outline" : "default"}
          className="text-[11px] capitalize"
        >
          {p.milestone === "advance" ? "50% Advance" : "50% Final Balance"}
        </Badge>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (p) => (
        <span className="font-semibold text-foreground">
          {formatCurrencyINR(p.amount)}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "paidAt",
      cell: (p) => (
        <span className="text-[12px] text-muted-foreground">
          {p.paidAt ? formatDate(p.paidAt) : "Pending"}
        </span>
      ),
    },
    {
      header: "Invoice",
      className: "text-right w-36",
      cell: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownloadInvoice(p)}
          className="h-8 text-[12px] border-border text-foreground hover:bg-surface px-2.5"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Invoice
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Milestones"
        description="Review transaction receipts, university escrow milestone progress, and tax invoices."
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Billed"
          value={formatCurrencyINR(totalBilled)}
          icon={<Receipt className="h-4 w-4" />}
          helperText="Combined total of all assigned tasks"
        />
        <StatCard
          label="Total Paid"
          value={formatCurrencyINR(totalPaid)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          helperText="Settled via Razorpay gateway"
        />
        <StatCard
          label="Balance Due"
          value={formatCurrencyINR(totalOutstanding)}
          icon={<IndianRupee className="h-4 w-4" />}
          helperText="Payable to unlock ready documents"
        />
      </div>

      {/* Active Milestone Tracker */}
      <MilestoneProgressBar
        totalAmount={1800}
        advanceAmount={900}
        remainingAmount={900}
        advancePaid={true}
        balancePaid={false}
      />

      {/* Transaction History Table */}
      <Card className="border border-border bg-background rounded-[8px] p-6 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
              Transaction History
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Official GST invoices for all advance deposits and deliverable unlock payments
            </p>
          </div>
        </div>

        <DataTable
          data={payments}
          columns={paymentColumns}
          searchKey="requestTitle"
          searchPlaceholder="Search transactions..."
          pageSize={5}
        />
      </Card>
    </div>
  );
}
