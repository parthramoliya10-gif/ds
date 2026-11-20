"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Role } from "@/types";
import supabase from "@/lib/supabase/client";
import api from "@/lib/api/client";
import { adaptProfileToUser } from "@/lib/api/adapters";

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  registerUser: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    college?: string;
    semester?: number | string;
  }) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user session on mount (runs once)
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.user) {
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
              setUser({
                id: session.user.id,
                name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "User",
                email: session.user.email || "",
                role: "student",
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
        if (session?.user) {
          try {
            const profile = await api.auth.getMe();
            setUser(adaptProfileToUser(profile));
          } catch {
            const meta = session.user.user_metadata || {};
            setUser({
              id: session.user.id,
              name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "User",
              email: session.user.email || "",
              role: "student",
            });
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Attempt Supabase Auth login with cookies handled by @supabase/ssr
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        let adapted: User;
        try {
          const profile = await api.auth.getMe();
          adapted = adaptProfileToUser(profile);
        } catch {
          const meta = data.user.user_metadata || {};
          adapted = {
            id: data.user.id,
            name: meta.full_name || meta.name || data.user.email?.split("@")[0] || "User",
            email: data.user.email || "",
            role: "student",
          };
        }
        setUser(adapted);

        // Safe redirect check
        const urlParams =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
        const redirectParam = urlParams?.get("redirect");

        let target = adapted.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

        if (
          redirectParam &&
          redirectParam.startsWith("/") &&
          !redirectParam.startsWith("//")
        ) {
          if (adapted.role === "admin" && redirectParam.startsWith("/admin")) {
            target = redirectParam;
          } else if (adapted.role !== "admin" && redirectParam.startsWith("/user")) {
            target = redirectParam;
          }
        }

        window.location.href = target;
      }
    } catch (err: any) {
      console.error("Login execution failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Google sign-in execution failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: { email: string; password: string; fullName: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("dsms_pending_email", data.email);
        sessionStorage.setItem("dsms_pending_name", data.fullName);
        sessionStorage.setItem("dsms_pending_password", data.password);
      }

      router.push("/verify-otp");
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
    setUser(null);
    router.push("/login");
  };

  const updateProfile = async (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    college?: string;
    semester?: number | string;
  }) => {
    // 1. Call backend API if user session is active
    try {
      const updateData: { fullName?: string; phone?: string; avatarUrl?: string | null } = {};
      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatarUrl !== undefined) {
        updateData.avatarUrl = data.avatarUrl === "" ? null : data.avatarUrl;
      }
      if (Object.keys(updateData).length > 0) {
        await api.auth.updateMe(updateData);
      }
    } catch (err) {
      console.warn("Backend updateMe failed, continuing with Supabase metadata:", err);
    }

    // 2. Update Supabase Auth user metadata (skip giant base64 data URIs to prevent bloating JWT tokens)
    try {
      const isBase64 = data.avatarUrl && data.avatarUrl.startsWith("data:");
      await supabase.auth.updateUser({
        data: {
          ...(data.fullName !== undefined && { full_name: data.fullName }),
          ...(data.avatarUrl !== undefined && !isBase64 && { avatar_url: data.avatarUrl }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.college !== undefined && { college: data.college }),
          ...(data.semester !== undefined && { semester: data.semester }),
        },
      });
    } catch (err) {
      console.warn("Supabase updateUser metadata update failed:", err);
    }

    // 3. Persist local college & semester override if changed
    if (data.college) localStorage.setItem("dsms_user_college", data.college);
    if (data.semester) localStorage.setItem("dsms_user_semester", String(data.semester));

    // 4. Update local user state immediately
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: data.fullName ?? prev.name,
        phone: data.phone ?? prev.phone,
        avatar: data.avatarUrl !== undefined ? (data.avatarUrl || undefined) : prev.avatar,
        college: data.college ?? prev.college,
        semester: data.semester
          ? typeof data.semester === "number"
            ? data.semester
            : parseInt(data.semester, 10)
          : prev.semester,
      };
    });
  };

  const updateEmail = async (newEmail: string) => {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      throw new Error(error.message);
    }
    if (data.user?.email && data.user.email === newEmail) {
      setUser((prev) => (prev ? { ...prev, email: newEmail } : null));
    }
    return data;
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  const refreshUser = async () => {
    try {
      const profile = await api.auth.getMe();
      if (profile) {
        setUser(adaptProfileToUser(profile));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: (user?.role?.toLowerCase() as Role) || "student",
        login,
        signInWithGoogle,
        registerUser,
        logout,
        isLoading,
        updateProfile,
        updateEmail,
        updatePassword,
        refreshUser,
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
