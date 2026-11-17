import * as React from "react";
import { FileText, Download } from "lucide-react";
import { MessageAttachment } from "@/types";
import { cn } from "@/lib/utils";

export interface AttachmentBubbleProps {
  attachment: MessageAttachment;
  isMe: boolean;
  className?: string;
}

export function AttachmentBubble({
  attachment,
  isMe,
  className,
}: AttachmentBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-3 max-w-[85%] sm:max-w-[70%]",
        isMe ? "ml-auto items-end" : "mr-auto items-start",
        className
      )}
    >
      <div
        className={cn(
          "rounded-[8px] p-3 flex items-center space-x-3 border transition-colors cursor-pointer",
          isMe
            ? "bg-foreground text-background border-foreground"
            : "bg-surface text-foreground border-border hover:bg-surface/80"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0",
            isMe ? "bg-background/20 text-background" : "bg-background border border-border text-foreground"
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
    </div>
  );
}
