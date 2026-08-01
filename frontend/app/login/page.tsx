"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import myLogo from "./CloudRage.png"; 
import { Mail, Lock, Cloud, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null); // Clear previous errors on new submit
      
      // IMPORTANT CHANGE: use credentials: 'include' and DO NOT set document.cookie on client
      // The backend must set the auth cookie with HttpOnly, Secure flags via Set-Cookie header.
      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensure cookies from backend are accepted (if cross-origin)
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        let errorMessage = "Invalid email or password";
        try {
          const errorData = await response.json();
          errorMessage = Array.isArray(errorData.message) 
            ? errorData.message[0] 
            : errorData.message || errorMessage;
        } catch (e) {
          // Fallback if response isn't JSON
        }
        throw new Error(errorMessage);
      }
      
      // We expect the backend to set HttpOnly cookie on successful login.
      // DO NOT set auth tokens from JS (previous code used document.cookie which is insecure).
      // Redirect after successful login
      router.push("/");
    } catch (error: any) {
      setServerError(error.message || "Login failed");
    }
  };

  // Framer Motion Variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-[#12162A]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(139,92,246,.18), transparent 30%),
          radial-gradient(circle at 85% 80%, rgba(6,182,212,.15), transparent 35%),
          radial-gradient(circle at 60% 10%, rgba(59,130,246,.08), transparent 25%)
        `
      }}
    >
      {/* Floating Animated Background Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4"
      >
        <Cloud className="h-12 w-12 text-[#8B5CF6]" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 left-1/4"
      >
        <div className="h-3 w-3 rounded-full bg-[#06B6D4]" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 flex flex-col items-center my-8"
      >
        {/* BRANDING: Custom Direct-Import Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative w-64 h-64 overflow-hidden mb-4">
            <Image
              src={myLogo}
              alt="CloudRage Logo"
              fill
              priority
              className="object-contain mix-blend-screen"
              style={{ filter: "invert(1) hue-rotate(180deg) brightness(1.2)" }}
            />
          </div>
        </motion.div>

        {/* Enhanced Glassmorphism Card */}
        <div className="w-full bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] rounded-[24px] overflow-hidden p-8">
          <div className="text-center mb-6">
            <h2 className="text-[24px] font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-[16px] text-[#B7C1D8]">Sign in to access your CloudVault storage</p>
          </div>

          {/* Neon Violet Error Banner */}
          {serverError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center gap-3 text-[#C4B5FD] text-sm shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-[#8B5CF6]" />
              <span>{serverError}</span>
            </motion.div>
          )}

          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4"
          >
            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-1.5 relative">
              <Label htmlFor="email" className="text-[14px] text-[#D3D8E7]">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7D879C] group-focus-within:text-[#8B5CF6] transition-colors" />
                <Input 
                  id="email" type="email" placeholder="name@example.com" 
                  className="pl-11 bg-white/5 border-white/10 text-[16px] text-[#F8FAFC] placeholder:text-[#7D879C] rounded-xl focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.25)] transition-all h-12"
                  {...register("email")} 
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 pt-0.5">{errors.email.message}</p>}
            </motion.div>
            
            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[14px] text-[#D3D8E7]">Password</Label>
                <Link href="/forgot-password" className="text-xs text-[#3B82F6] hover:text-[#8B5CF6] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7D879C] group-focus-within:text-[#8B5CF6] transition-colors" />
                <Input 
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" 
                  className="pl-11 pr-11 bg-white/5 border-white/10 text-[16px] text-[#F8FAFC] placeholder:text-[#7D879C] rounded-xl focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.25)] transition-all h-12"
                  {...register("password")} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D879C] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 pt-0.5">{errors.password.message}</p>}
            </motion.div>

            {/* Primary Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full text-[16px] font-semibold bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] hover:scale-[1.03] active:scale-[0.98] text-white py-6 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all rounded-[14px]"
              >
                {isSubmitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <><span>Sign In</span> <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </motion.div>
          </motion.form>
          
          <div className="mt-6 text-center text-sm text-[#B7C1D8]">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#3B82F6] font-semibold hover:text-[#8B5CF6] transition-colors">
              Sign up here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
