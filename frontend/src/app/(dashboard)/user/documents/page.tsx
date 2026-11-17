"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinalDocumentCard } from "@/components/documents/FinalDocumentCard";
import { RazorpayModal } from "@/components/payments/RazorpayModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { mockDocuments, mockRequests } from "@/lib/mock-data";
import { FinalDocument } from "@/types";
import { formatCurrencyINR } from "@/lib/utils";
import { FolderDown, Lock, Download, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function UserDocumentsPage() {
  const [documents, setDocuments] = React.useState<FinalDocument[]>(mockDocuments);
  const [filter, setFilter] = React.useState("all");

  const [selectedDocForPayment, setSelectedDocForPayment] = React.useState<{
    doc: FinalDocument;
    amount: number;
    title: string;
  } | null>(null);

  const filteredDocs = React.useMemo(() => {
    if (filter === "locked") return documents.filter((d) => d.isLocked);
    if (filter === "unlocked") return documents.filter((d) => !d.isLocked);
    return documents;
  }, [documents, filter]);

  const handlePaymentSuccess = ({ transactionId }: { transactionId: string }) => {
    if (!selectedDocForPayment) return;
    const docId = selectedDocForPayment.doc.id;

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isLocked: false } : d))
    );

    toast.success("Document unlocked! Download link is now active.");
    setSelectedDocForPayment(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Deliverables & Documents"
        description="Access and download your completed assignments, verified lab manual codes, and practical file PDFs."
      />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="h-10 border border-border bg-surface p-1">
            <TabsTrigger value="all" className="text-[12px]">All Files ({documents.length})</TabsTrigger>
            <TabsTrigger value="unlocked" className="text-[12px]">Unlocked ({documents.filter((d) => !d.isLocked).length})</TabsTrigger>
            <TabsTrigger value="locked" className="text-[12px]">Locked ({documents.filter((d) => d.isLocked).length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FolderDown className="h-6 w-6 stroke-[1.5]" />}
          title="No documents in this view"
          description="Completed documents will appear here once the specialist finishes drafting."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => {
            const req = mockRequests.find((r) => r.id === doc.requestId);
            const remainingAmount = req?.balanceAmount || 900;

            return (
              <FinalDocumentCard
                key={doc.id}
                document={doc}
                remainingAmount={remainingAmount}
                isLocked={doc.isLocked}
                onPayToUnlock={() =>
                  setSelectedDocForPayment({
                    doc,
                    amount: remainingAmount,
                    title: req?.title || doc.fileName,
                  })
                }
                onDownload={() => toast.success(`Downloading ${doc.fileName}...`)}
              />
            );
          })}
        </div>
      )}

      {/* Razorpay Modal for document unlocking */}
      {selectedDocForPayment && (
        <RazorpayModal
          isOpen={Boolean(selectedDocForPayment)}
          onClose={() => setSelectedDocForPayment(null)}
          amount={selectedDocForPayment.amount}
          title={selectedDocForPayment.title}
          milestoneType="remaining"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
