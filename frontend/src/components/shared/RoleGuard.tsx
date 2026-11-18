"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface RoleGuardProps {
  allow: "admin" | "student";
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const normalizedRole = user?.role?.toLowerCase() === "admin" ? "admin" : "student";

  React.useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (normalizedRole !== allow) {
      const destination = normalizedRole === "admin" ? "/admin/dashboard" : "/user/dashboard";
      router.replace(destination);
    }
  }, [user, isLoading, normalizedRole, allow, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || normalizedRole !== allow) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
