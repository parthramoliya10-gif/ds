import * as React from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageSquare } from "lucide-react";

export default function UserChatPlaceholderPage() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <EmptyState
        icon={<MessageSquare className="h-6 w-6 stroke-[1.5]" />}
        title="Select a conversation"
        description="Choose a college task request from the list to view real-time messages, quotation milestones, and task updates."
      />
    </div>
  );
}
