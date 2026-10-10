"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const rawError = searchParams.get("error");
  const error = rawError ? decodeURIComponent(rawError) : asyncError;

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = searchParams.get("token") || searchParams.get("access_token");
      const name = searchParams.get("name");
      const email = searchParams.get("email");

      if (rawError) return;

      if (token) {
        // Store auth token in cookie
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax${isSecure ? "; Secure" : ""}`;

        // Store display info in localStorage
        if (name) {
          localStorage.setItem("user_name", decodeURIComponent(name));
        } else if (email) {
          localStorage.setItem("user_name", email.split("@")[0]);
        }

        if (email) {
          localStorage.setItem("user_email", decodeURIComponent(email));
        }

        // Redirect directly to dashboard
        router.replace("/dashboard");
      } else {
        setAsyncError("No authentication token received. Please try signing in again.");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router, searchParams, rawError]);

  if (error) {
    return (
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-sm text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">Authentication Failed</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        <a
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-center space-y-4">
      <div className="relative mx-auto h-14 w-14">
        <Image
          src="/logo.png"
          alt="CloudRage"
          width={56}
          height={56}
          className="h-14 w-14 object-contain animate-pulse"
          priority
        />
      </div>
      <div className="flex items-center justify-center space-x-2 text-muted-foreground text-xs">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span>Authenticating your Google account...</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-xs text-muted-foreground flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Loading authentication...</span>
          </div>
        }
      >
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
