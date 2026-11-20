import * as React from "react";
import { FileText, Download, Trash2, MoreVertical } from "lucide-react";
import { MessageAttachment } from "@/types";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/download";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AttachmentBubbleProps {
  attachment: MessageAttachment;
  isMe: boolean;
  className?: string;
  onDownload?: () => void;
  onDelete?: (type: "for_me" | "for_everyone") => void;
}

export function AttachmentBubble({
  attachment,
  isMe,
  className,
  onDownload,
  onDelete,
}: AttachmentBubbleProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleClick = () => {
    if (onDownload) {
      onDownload();
    } else if (attachment.url) {
      try {
        downloadFile(attachment.url, attachment.name);
      } catch (err) {
        console.error("Failed to download attachment:", err);
      }
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex flex-col mb-3 max-w-[85%] sm:max-w-[70%] group relative",
          isMe ? "ml-auto items-end" : "mr-auto items-start",
          className
        )}
      >
        <div className="relative flex items-center group">
          {/* Options Dropdown button for sent attachment */}
          {isMe && onDelete && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive text-[12px] flex items-center cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
            className={cn(
              "rounded-[8px] p-3 flex items-center space-x-3 border transition-colors cursor-pointer select-none",
              isMe
                ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                : "bg-surface text-foreground border-border hover:bg-surface/80"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0",
                isMe
                  ? "bg-background/20 text-background"
                  : "bg-background border border-border text-foreground"
              )}
            >
              <FileText className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[13px] font-semibold truncate leading-tight">
                {attachment.name}
              </p>
              <p
                className={cn(
                  "text-[11px] mt-0.5",
                  isMe ? "text-background/80" : "text-muted-foreground"
                )}
              >
                {attachment.size}
              </p>
            </div>

            <Download className="h-4 w-4 shrink-0 opacity-80 hover:opacity-100" />
          </div>

          {/* Options Dropdown button for received attachment */}
          {!isMe && onDelete && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive text-[12px] flex items-center cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete for me
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-[10px] p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[16px] font-semibold">
              Delete file?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground pt-1">
              {isMe
                ? "You can delete this file for everyone or delete it just for yourself."
                : "This file message will be removed from your view only."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-3">
            {isMe && (
              <Button
                variant="destructive"
                className="w-full h-9 text-[13px] font-medium"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  onDelete?.("for_everyone");
                }}
              >
                Delete for everyone
              </Button>
            )}

            <Button
              variant={isMe ? "outline" : "destructive"}
              className="w-full h-9 text-[13px] font-medium"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete?.("for_me");
              }}
            >
              Delete for me
            </Button>

            <Button
              variant="ghost"
              className="w-full h-9 text-[13px] text-muted-foreground hover:text-foreground"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
