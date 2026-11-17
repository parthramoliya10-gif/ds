import * as React from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileItem {
  id: string;
  name: string;
  size: string;
  file?: File;
}

export interface FileDropzoneProps {
  onFilesChange?: (files: FileItem[]) => void;
  maxFiles?: number;
  className?: string;
  accept?: string;
}

export function FileDropzone({
  onFilesChange,
  maxFiles = 5,
  className,
  accept = ".pdf,.docx,.doc,.txt,.zip,.png,.jpg",
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const addFiles = (newFileList: FileList | null) => {
    if (!newFileList) return;
    const added: FileItem[] = Array.from(newFileList).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: formatFileSize(f.size),
      file: f,
    }));

    const combined = [...files, ...added].slice(0, maxFiles);
    setFiles(combined);
    onFilesChange?.(combined);
  };

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center p-6 border border-dashed rounded-[8px] cursor-pointer transition-colors text-center bg-background",
          isDragOver ? "border-foreground bg-surface" : "border-border hover:border-foreground/60"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center mb-3 bg-surface text-foreground">
          <UploadCloud className="h-5 w-5 stroke-[1.75]" />
        </div>
        <p className="text-[14px] font-medium text-foreground mb-1">
          Click to upload or drag & drop files
        </p>
        <p className="text-[12px] text-muted-foreground">
          PDF, DOCX, ZIP, or images up to 25MB (Max {maxFiles} files)
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-[8px] border border-border bg-surface text-[14px]"
            >
              <div className="flex items-center space-x-2 truncate">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground font-medium">{file.name}</span>
                <span className="text-[12px] text-muted-foreground shrink-0">({file.size})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
