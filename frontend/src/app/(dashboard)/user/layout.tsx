import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow="student">
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop Sidebar (>=860px) */}
        <Sidebar role="student" />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar role="student" />
          <main className="flex-1 p-4 sm:p-6 pb-24 min-[860px]:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Tab Bar (<860px) */}
        <MobileTabBar role="student" />
      </div>
    </RoleGuard>
  );
}
