"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinalDocumentCard } from "@/components/documents/FinalDocumentCard";
import { RazorpayModal } from "@/components/payments/RazorpayModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FinalDocument, Request } from "@/types";
import api from "@/lib/api/client";
import { adaptFinalDocumentToFrontend, adaptRequestToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR } from "@/lib/utils";
import { FolderDown, Lock, Download, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";

export default function UserDocumentsPage() {
  const [documents, setDocuments] = React.useState<FinalDocument[]>([]);
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [filter, setFilter] = React.useState("all");

  const [selectedDocForPayment, setSelectedDocForPayment] = React.useState<{
    doc: FinalDocument;
    amount: number;
    title: string;
    requestId?: string;
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function loadUserDocuments() {
      try {
        const res = await api.requests.list({ limit: 50 });
        if (mounted && res && Array.isArray(res.requests)) {
          const adaptedRequests = res.requests.map(adaptRequestToFrontend);
          setRequests(adaptedRequests);

          const docsFromRequests: FinalDocument[] = [];
          res.requests.forEach((r: any) => {
            if (r.finalDocuments && r.finalDocuments.length > 0) {
              r.finalDocuments.forEach((fd: any) => {
                docsFromRequests.push({
                  ...adaptFinalDocumentToFrontend(fd),
                  requestId: r.id,
                  isLocked: !r.isDownloadUnlocked,
                });
              });
            }
          });

          setDocuments(docsFromRequests);
        }
      } catch (err) {
        console.warn("Could not load backend documents:", err);
      }
    }
    loadUserDocuments();
    return () => {
      mounted = false;
    };
  }, []);

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

  const handleDownload = async (doc: FinalDocument) => {
    if (doc.id) {
      try {
        toast.info(`Preparing download for ${doc.fileName}...`);
        const res = await api.documents.getDownloadInfo(doc.id);
        if (res && res.downloadUrl) {
          downloadFile(res.downloadUrl, res.fileName || doc.fileName);
          toast.success(`Download started for ${doc.fileName}`);
        } else {
          toast.error("Download link expired or not found.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to download document.");
      }
    } else {
      toast.info("Download link not available.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Deliverables & Documents"
        description="Access and download your completed assignments, verified lab manual codes, and practical file PDFs."
      />

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto max-w-full min-w-0">
          <TabsList className="w-full sm:w-auto max-w-full flex items-center justify-start overflow-x-auto no-scrollbar h-10 border border-border bg-surface p-1">
            <TabsTrigger value="all" className="text-[12px] px-3 shrink-0">All Files ({documents.length})</TabsTrigger>
            <TabsTrigger value="unlocked" className="text-[12px] px-3 shrink-0">Unlocked ({documents.filter((d) => !d.isLocked).length})</TabsTrigger>
            <TabsTrigger value="locked" className="text-[12px] px-3 shrink-0">Locked ({documents.filter((d) => d.isLocked).length})</TabsTrigger>
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
            const req = requests.find((r) => r.id === doc.requestId);
            const remainingAmount = req?.balanceAmount || 0;

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
                    requestId: req?.id,
                  })
                }
                onDownload={() => handleDownload(doc)}
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
          requestId={selectedDocForPayment.requestId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
