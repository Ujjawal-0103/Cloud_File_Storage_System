"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User, Mail, Lock, Cloud, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import myLogo from "./CloudRage.png";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      document.cookie = "auth_token=mock-jwt-token-123456; path=/";
      router.push("/");
    } catch (error) {
      console.error(error);
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
        
        {/* BRANDING: Direct Import Custom Logo */}
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
            <h2 className="text-[24px] font-bold text-white mb-2">Create Your Account</h2>
            <p className="text-[16px] text-[#B7C1D8]">Join CloudVault to store and manage files</p>
          </div>

          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4"
          >
            {/* Name Field */}
            <motion.div variants={itemVariants} className="space-y-1.5 relative">
              <Label htmlFor="name" className="text-[14px] text-[#D3D8E7]">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7D879C] group-focus-within:text-[#8B5CF6] transition-colors" />
                <Input 
                  id="name" type="text" placeholder="John Doe" 
                  className="pl-11 bg-white/5 border-white/10 text-[16px] text-[#F8FAFC] placeholder:text-[#7D879C] rounded-xl focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.25)] transition-all h-12"
                  {...register("name")} 
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 pt-0.5">{errors.name.message}</p>}
            </motion.div>

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
              <Label htmlFor="password" className="text-[14px] text-[#D3D8E7]">Password</Label>
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

            {/* Confirm Password Field */}
            <motion.div variants={itemVariants} className="space-y-1.5 relative">
              <Label htmlFor="confirmPassword" className="text-[14px] text-[#D3D8E7]">Confirm Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7D879C] group-focus-within:text-[#8B5CF6] transition-colors" />
                <Input 
                  id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" 
                  className="pl-11 pr-11 bg-white/5 border-white/10 text-[16px] text-[#F8FAFC] placeholder:text-[#7D879C] rounded-xl focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.25)] transition-all h-12"
                  {...register("confirmPassword")} 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7D879C] hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 pt-0.5">{errors.confirmPassword.message}</p>}
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
                  <>Create Account <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </Button>
            </motion.div>
          </motion.form>
          
          {/* Social Logins */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6"
          >
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-[#7D879C] text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
</svg> GitHub
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-[#B7C1D8]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3B82F6] font-semibold hover:text-[#8B5CF6] transition-colors">
                Sign in here
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}