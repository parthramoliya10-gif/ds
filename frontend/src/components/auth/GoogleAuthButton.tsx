"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (notification?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "654868280866-m1sj3cen89621apedn5lhsqp0qr1g7pf.apps.googleusercontent.com";

export function GoogleAuthButton({
  label = "Continue with Google",
  className,
}: GoogleAuthButtonProps) {
  const { signInWithGoogle, loginWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = React.useState(false);

  // Initialize Google One-Tap in the background if supported
  React.useEffect(() => {
    let mounted = true;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response?.credential && mounted) {
              setLoading(true);
              try {
                await loginWithGoogleIdToken(response.credential);
              } catch (err: any) {
                toast.error(err.message || "Failed to sign in with Google.");
                setLoading(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Display One-Tap popup in top corner if supported
        try {
          window.google.accounts.id.prompt();
        } catch {}
      } catch (err) {
        console.warn("Google GSI initialization error:", err);
      }
    };

    const scriptId = "google-gsi-client";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!window.google?.accounts?.id) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (mounted) initGsi();
        };
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", () => {
          if (mounted) initGsi();
        });
      }
    } else {
      initGsi();
    }

    return () => {
      mounted = false;
    };
  }, [loginWithGoogleIdToken]);

  const handleClick = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google sign-in.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex h-10 w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground hover:bg-surface font-medium transition-colors items-center justify-center space-x-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}
