import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  badge?: string;
}

export function ComingSoon({ title, description, badge = "Phase 2 / 3" }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card className="border border-border bg-background p-8 rounded-[8px]">
        <CardContent className="p-0 flex flex-col items-center justify-center text-center py-12">
          <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-4 bg-surface text-foreground">
            <Clock className="h-6 w-6 stroke-[1.5]" />
          </div>
          <span className="text-[12px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            {badge}
          </span>
          <h3 className="text-[18px] font-semibold text-foreground mb-2">
            Feature in development
          </h3>
          <p className="text-[14px] text-muted-foreground max-w-md leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
