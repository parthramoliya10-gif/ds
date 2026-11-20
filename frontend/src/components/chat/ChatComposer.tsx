import * as React from "react";
import { Paperclip, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatComposerProps {
  onSendMessage: (content: string, file?: File) => void;
  className?: string;
  placeholder?: string;
  extraActions?: React.ReactNode;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatComposer({
  onSendMessage,
  className,
  placeholder = "Type your query or task requirements...",
  extraActions,
  onTypingChange,
  disabled = false,
}: ChatComposerProps) {
  const [text, setText] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (onTypingChange) {
      onTypingChange(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 1500);
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !selectedFile) || isSubmitting) return;
    setIsSubmitting(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTypingChange) onTypingChange(false);
    const contentToSend = text.trim();
    const fileToSend = selectedFile || undefined;
    setText("");
    setSelectedFile(null);
    try {
      onSendMessage(contentToSend, fileToSend);
    } finally {
      setTimeout(() => setIsSubmitting(false), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("border-t border-border bg-background p-3", className)}>
      {selectedFile && (
        <div className="flex items-center justify-between p-2 mb-2 rounded-[6px] border border-border bg-surface text-[12px]">
          <span className="truncate max-w-xs font-medium text-foreground">
            Attached: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
          }}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="h-10 w-10 shrink-0 border-border rounded-[8px] text-muted-foreground hover:text-foreground"
          title="Attach file or screenshot"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {extraActions}

        <textarea
          rows={1}
          value={text}
          disabled={disabled}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Chat is disabled for completed or cancelled requests." : placeholder}
          className="flex-1 min-h-[40px] max-h-32 resize-none rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground placeholder:truncate focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !selectedFile)}
          className="h-10 w-10 shrink-0 rounded-[8px]"
          title="Send message"
        >
          <ArrowUp className="h-4 w-4 stroke-[2.5]" />
        </Button>
      </div>
    </div>
  );
}
