import * as React from "react";
import { Check, CheckCheck, Trash2, MoreVertical, Ban } from "lucide-react";
import { Message } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";
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

export interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  className?: string;
  senderLabel?: string;
  onDelete?: (messageId: string, type: "for_me" | "for_everyone") => void;
}

export function MessageBubble({
  message,
  isMe,
  className,
  senderLabel,
  onDelete,
}: MessageBubbleProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const renderTicks = () => {
    if (!isMe) return null;
    switch (message.status) {
      case "read":
        return (
          <span title="Read" className="text-sky-400 inline-flex items-center">
            <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        );
      case "delivered":
        return (
          <span title="Delivered" className="opacity-70 inline-flex items-center">
            <CheckCheck className="h-3.5 w-3.5 stroke-[2]" />
          </span>
        );
      case "sent":
      default:
        return (
          <span title="Sent" className="opacity-70 inline-flex items-center">
            <Check className="h-3.5 w-3.5 stroke-[2]" />
          </span>
        );
    }
  };

  const displayName =
    senderLabel ||
    (message.senderRole === "student" ? "Student" : "DSMS Specialist");

  // WhatsApp-style "This message was deleted" bubble
  if (message.isDeletedForEveryone) {
    return (
      <div
        className={cn(
          "flex flex-col mb-3 max-w-[85%] sm:max-w-[75%] group",
          isMe ? "ml-auto items-end" : "mr-auto items-start",
          className
        )}
      >
        {!isMe && (
          <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
            {displayName}
          </span>
        )}

        <div className="relative flex items-center">
          <div
            className={cn(
              "rounded-[8px] px-3.5 py-2 text-[13px] leading-relaxed shadow-none flex items-center space-x-1.5 italic select-none border border-dashed",
              isMe
                ? "bg-muted/40 border-border text-muted-foreground"
                : "bg-surface border-border text-muted-foreground"
            )}
          >
            <Ban className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
            <span>
              {isMe ? "You deleted this message" : "This message was deleted"}
            </span>
            <span className="text-[10px] ml-2 not-italic text-muted-foreground/70">
              {formatDateTime(message.timestamp)}
            </span>
          </div>

          {/* User can still delete the placeholder for themselves */}
          {onDelete && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(message.id, "for_me")}
                title="Delete for me"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col mb-3 max-w-[85%] sm:max-w-[75%] group relative",
          isMe ? "ml-auto items-end" : "mr-auto items-start",
          className
        )}
      >
        {!isMe && (
          <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
            {displayName}
          </span>
        )}

        <div className="relative flex items-center group">
          {/* Options Dropdown button for sent messages (left side of bubble) */}
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
                    Delete message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div
            className={cn(
              "rounded-[8px] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-none",
              isMe
                ? "bg-foreground text-background font-normal"
                : "bg-surface border border-border text-foreground font-normal"
            )}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>

            <div
              className={cn(
                "flex items-center justify-end space-x-1.5 mt-1 text-[10px]",
                isMe ? "text-background/80" : "text-muted-foreground"
              )}
            >
              <span>{formatDateTime(message.timestamp)}</span>
              {renderTicks()}
            </div>
          </div>

          {/* Options Dropdown button for received messages (right side of bubble) */}
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

      {/* WhatsApp-style Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-[10px] p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[16px] font-semibold">
              Delete message?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground pt-1">
              {isMe
                ? "You can delete this message for everyone or delete it just for yourself."
                : "This message will be removed from your view only."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-3">
            {isMe && (
              <Button
                variant="destructive"
                className="w-full h-9 text-[13px] font-medium"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  onDelete?.(message.id, "for_everyone");
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
                onDelete?.(message.id, "for_me");
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
