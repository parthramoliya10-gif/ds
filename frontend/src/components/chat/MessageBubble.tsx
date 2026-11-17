import * as React from "react";
import { Check, CheckCheck } from "lucide-react";
import { Message } from "@/types";
import { cn, formatDateTime } from "@/lib/utils";

export interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  className?: string;
  senderLabel?: string;
}

export function MessageBubble({ message, isMe, className, senderLabel }: MessageBubbleProps) {
  const renderTicks = () => {
    if (!isMe) return null;
    switch (message.status) {
      case "read":
        return (
          <span title="Read">
            <CheckCheck className="h-3.5 w-3.5 text-background stroke-[2.5]" />
          </span>
        );
      case "delivered":
        return (
          <span title="Delivered">
            <CheckCheck className="h-3.5 w-3.5 text-background/70 stroke-[2]" />
          </span>
        );
      case "sent":
      default:
        return (
          <span title="Sent">
            <Check className="h-3.5 w-3.5 text-background/70 stroke-[2]" />
          </span>
        );
    }
  };

  const displayName =
    senderLabel ||
    (message.senderRole === "student" ? "Student" : "DSMS Specialist");

  return (
    <div
      className={cn(
        "flex flex-col mb-3 max-w-[85%] sm:max-w-[75%]",
        isMe ? "ml-auto items-end" : "mr-auto items-start",
        className
      )}
    >
      {!isMe && (
        <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
          {displayName}
        </span>
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
    </div>
  );
}
