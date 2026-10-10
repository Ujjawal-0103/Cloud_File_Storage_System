"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setServerError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);

      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Invalid email or password";
        try {
          const errorData = await response.json();
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message || errorMessage;
        } catch {
          // Fallback if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Store the returned JWT token in cookies
      if (result.access_token) {
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `auth_token=${result.access_token}; path=/; max-age=604800; SameSite=Lax${isSecure ? "; Secure" : ""}`;
      }

      // Format name nicely
      const rawName = result.name || result.user?.name || data.email.split("@")[0];
      const formattedName = rawName
        .split(/[\s._-]+/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      localStorage.setItem("user_name", formattedName);
      localStorage.setItem("user_email", data.email);

      router.push("/dashboard");
    } catch (error: any) {
      setServerError(error.message || "Login failed");
    }
  };

  const handleGoogleSignIn = () => {
    if (isGoogleLoading || isSubmitting) return;
    setIsGoogleLoading(true);
    setServerError(null);
    window.location.href = "/api/backend/auth/google";
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Branding with enlarged logo */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Image
          src="/logo.png"
          alt="CloudRage"
          width={88}
          height={88}
          className="h-20 w-20 sm:h-22 sm:w-22 object-contain mx-auto transition-transform hover:scale-105 duration-200"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in to CloudRage</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Secure, high-performance cloud storage for teams and individuals.
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-6 sm:p-8 space-y-5 text-card-foreground">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-red-700 dark:text-red-400 text-xs animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-foreground/90">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full rounded-xl bg-background border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 dark:text-red-400 pt-0.5">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-foreground/90">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl bg-background border border-border pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 dark:text-red-400 pt-0.5">{errors.password.message}</p>}
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Social Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-card px-2.5 text-muted-foreground font-medium">Or continue with</span>
          </div>
        </div>

        {/* Social Logins: Continue with Google */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-background border border-border hover:bg-muted/70 text-foreground text-xs font-semibold transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 11.3 0 14s.7 5.2 1.9 7.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.3L1.9 15.9C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 text-foreground transition-colors">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
