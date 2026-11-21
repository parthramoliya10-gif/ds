import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  onSubmitRevision: (notes: string) => void;
}

export function RevisionModal({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  onSubmitRevision,
}: RevisionModalProps) {
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Please provide at least 10 characters describing the required revisions.");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitting(false);
    onSubmitRevision(notes);
    toast.success("Revision request submitted to the specialist!");
    onClose();
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border border-border bg-background p-6 rounded-[8px] shadow-none">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-[18px] font-semibold text-foreground">
            Request Task Revision
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {requestId} • {requestTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="revisionNotes" className="text-[13px]">
              What changes or additions are required?
            </Label>
            <Textarea
              id="revisionNotes"
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please add output screenshot for experiment 4 and format citations in IEEE style..."
              className="text-[14px]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-[13px] border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !notes.trim()}
              className="h-9 text-[13px] font-medium"
            >
              {submitting ? "Submitting..." : "Submit Revision Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
