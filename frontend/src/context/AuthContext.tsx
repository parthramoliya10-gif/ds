"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Role } from "@/types";
import { mockUsers } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (email: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if path indicates admin
    const savedRole = typeof window !== "undefined" ? localStorage.getItem("dsms_mock_role") : null;
    if (savedRole === "admin" || pathname?.startsWith("/admin")) {
      setUser(mockUsers.admin);
    } else {
      setUser(mockUsers.student);
    }
    setIsLoading(false);
  }, [pathname]);

  const login = async (email: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const normalized = email.toLowerCase();
    if (normalized.includes("admin")) {
      setUser(mockUsers.admin);
      if (typeof window !== "undefined") localStorage.setItem("dsms_mock_role", "admin");
      router.push("/admin/dashboard");
    } else {
      setUser(mockUsers.student);
      if (typeof window !== "undefined") localStorage.setItem("dsms_mock_role", "student");
      router.push("/user/dashboard");
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem("dsms_mock_role");
    router.push("/login");
  };

  const switchRole = (newRole: Role) => {
    if (newRole === "admin") {
      setUser(mockUsers.admin);
      if (typeof window !== "undefined") localStorage.setItem("dsms_mock_role", "admin");
      router.push("/admin/dashboard");
    } else {
      setUser(mockUsers.student);
      if (typeof window !== "undefined") localStorage.setItem("dsms_mock_role", "student");
      router.push("/user/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "student",
        login,
        logout,
        switchRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
