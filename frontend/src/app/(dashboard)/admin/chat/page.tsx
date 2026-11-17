import * as React from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageSquare } from "lucide-react";

export default function AdminChatPlaceholderPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <EmptyState
        icon={<MessageSquare className="h-6 w-6 stroke-[1.5]" />}
        title="Select a conversation"
        description="Choose a student request from the sidebar to review questions, issue milestone quotations, and communicate directly."
      />
    </div>
  );
}
