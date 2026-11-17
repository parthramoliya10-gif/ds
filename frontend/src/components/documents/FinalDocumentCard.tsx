import * as React from "react";
import { FinalDocument } from "@/types";
import { formatCurrencyINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Lock,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FinalDocumentCardProps {
  document: FinalDocument;
  remainingAmount: number;
  isLocked: boolean;
  onPayToUnlock: () => void;
  onRequestRevision?: () => void;
  onDownload?: () => void;
  className?: string;
}

export function FinalDocumentCard({
  document,
  remainingAmount,
  isLocked,
  onPayToUnlock,
  onRequestRevision,
  onDownload,
  className,
}: FinalDocumentCardProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-border bg-background p-5 shadow-none space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-foreground" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Final Deliverable
          </span>
        </div>
        <div>
          {isLocked ? (
            <Badge variant="boldBorder" className="text-[11px] flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked (Payment Pending)
            </Badge>
          ) : (
            <Badge variant="default" className="text-[11px] bg-foreground text-background">
              Unlocked & Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-[16px] font-semibold text-foreground tracking-tight line-clamp-1">
            {document.fileName}
          </h4>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {document.pageCount} Pages • {document.fileSize} • Uploaded by Specialist
          </p>
        </div>
      </div>

      {/* Preview Area (Blurred if locked) */}
      <div className="relative rounded-[8px] border border-border bg-surface p-6 overflow-hidden min-h-[160px] flex items-center justify-center">
        {/* Mock Document Page Background */}
        <div
          className={cn(
            "w-full max-w-sm space-y-2 select-none transition-all duration-300",
            isLocked && "filter blur-[5px] opacity-40 pointer-events-none"
          )}
        >
          <div className="h-4 bg-border rounded w-3/4" />
          <div className="h-2.5 bg-border rounded w-full" />
          <div className="h-2.5 bg-border rounded w-5/6" />
          <div className="h-2.5 bg-border rounded w-4/5" />
          <div className="h-20 bg-background border border-border rounded mt-3 p-2 text-[10px] text-muted-foreground flex items-center justify-center">
            [ Verified Code Screenshots & Output Diagrams ]
          </div>
        </div>

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 rounded-full border border-foreground bg-background text-foreground flex items-center justify-center mb-2">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-[13px] font-semibold text-foreground">
              Document Preview Blurred
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
              Pay the final 50% milestone ({formatCurrencyINR(remainingAmount)}) to unlock full high-resolution PDF download and clear preview.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        {isLocked ? (
          <>
            <Button
              type="button"
              disabled
              isLocked
              variant="outline"
              className="w-full sm:w-auto h-10 text-[13px] border-border text-muted-foreground opacity-70"
            >
              Pay Rs {remainingAmount} to unlock download
            </Button>
            <Button
              type="button"
              onClick={onPayToUnlock}
              className="w-full sm:w-auto h-10 text-[13px] font-semibold px-6"
            >
              Pay Now ({formatCurrencyINR(remainingAmount)})
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={onDownload}
              className="w-full sm:w-auto h-10 text-[13px] font-semibold px-6"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Final PDF
            </Button>

            {onRequestRevision && (
              <Button
                type="button"
                variant="outline"
                onClick={onRequestRevision}
                className="w-full sm:w-auto h-10 text-[13px] border-border"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Request Revision
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
