"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Role } from "@/types";
import supabase from "@/lib/supabase/client";
import api from "@/lib/api/client";
import { adaptProfileToUser } from "@/lib/api/adapters";

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (email: string, password?: string) => Promise<void>;
  registerUser: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.access_token) {
          localStorage.setItem("dsms_auth_token", session.access_token);
          try {
            const profile = await api.auth.getMe();
            if (isMounted && profile) {
              const adapted = adaptProfileToUser(profile);
              setUser(adapted);
              setIsLoading(false);
              return;
            }
          } catch (profileErr) {
            console.warn("Backend profile lookup failed, using Supabase metadata:", profileErr);
            if (isMounted) {
              const meta = session.user.user_metadata || {};
              const isAdmin = session.user.email?.includes("admin");
              setUser({
                id: session.user.id,
                name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "User",
                email: session.user.email || "",
                role: isAdmin ? "admin" : "student",
              });
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state change events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          localStorage.setItem("dsms_auth_token", session.access_token);
          try {
            const profile = await api.auth.getMe();
            setUser(adaptProfileToUser(profile));
          } catch {
            // Ignore background error
          }
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("dsms_auth_token");
          localStorage.removeItem("dsms_mock_role");
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const login = async (email: string, password = "password123") => {
    setIsLoading(true);
    try {
      // Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        localStorage.setItem("dsms_auth_token", data.session.access_token);
        const profile = await api.auth.getMe();
        const adapted = adaptProfileToUser(profile);
        setUser(adapted);

        if (adapted.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/user/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Login execution failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: { email: string; password: string; fullName: string }) => {
    setIsLoading(true);
    try {
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (res.session) {
        localStorage.setItem("dsms_auth_token", res.session.access_token);
        const profile = await api.auth.getMe();
        setUser(adaptProfileToUser(profile));
        router.push("/user/dashboard");
      } else {
        // Needs email verification or auto redirected
        router.push("/verify-otp");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut network errors
    }
    localStorage.removeItem("dsms_auth_token");
    localStorage.removeItem("dsms_mock_role");
    setUser(null);
    router.push("/login");
  };

  const switchRole = async (newRole: Role) => {
    setIsLoading(true);
    if (newRole === "admin" || newRole === "ADMIN") {
      await login("admin@dsms.internal", "password123");
    } else {
      await login("aarav.sharma@dtu.ac.in", "password123");
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.role?.toLowerCase() as Role) || "student",
        login,
        registerUser,
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

export default AuthContext;
