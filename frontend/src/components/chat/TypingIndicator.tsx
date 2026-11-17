import * as React from "react";
import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-start mb-3 max-w-[70%]", className)}>
      <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-1">
        Specialist is typing...
      </span>
      <div className="rounded-[8px] px-3.5 py-3 bg-surface border border-border flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce" />
      </div>
    </div>
  );
}
