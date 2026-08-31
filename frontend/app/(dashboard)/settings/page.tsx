"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Key,
  HardDrive,
  Moon,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  Sliders,
  Database,
  Lock,
} from "lucide-react";

const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
};

export default function SettingsPage() {
  const router = useRouter();

  // Profile State
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("user@cloudrage.com");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoPreview, setAutoPreview] = useState(true);

  // Storage stats
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    const savedEmail = localStorage.getItem("user_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);

    const savedAutoPreview = localStorage.getItem("setting_auto_preview");
    if (savedAutoPreview !== null) setAutoPreview(savedAutoPreview === "true");

    const savedEmailNotifs = localStorage.getItem("setting_email_notifs");
    if (savedEmailNotifs !== null) setEmailNotifications(savedEmailNotifs === "true");

    const fetchUserData = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        // Fetch Profile
        const profileRes = await fetch("/api/backend/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.name) {
            setName(profileData.name);
            localStorage.setItem("user_name", profileData.name);
          }
          if (profileData.email) {
            setEmail(profileData.email);
            localStorage.setItem("user_email", profileData.email);
          }
        }

        // Fetch Storage
        const res = await fetch("/api/backend/files/storage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStorageUsedBytes(data.usedBytes || 0);
        }
      } catch (err) {
        console.error("Error fetching user settings data:", err);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSavingProfile(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/backend/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setName(updated.name);
        localStorage.setItem("user_name", updated.name);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      } else {
        localStorage.setItem("user_name", name.trim());
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err) {
      localStorage.setItem("user_name", name.trim());
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch("/api/backend/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 4000);
      } else {
        const data = await res.json();
        setPasswordError(data.message || "Failed to update password. Please check your current password.");
      }
    } catch (err) {
      setPasswordError("Network error while updating password.");
    }
  };

  const toggleAutoPreview = () => {
    const nextVal = !autoPreview;
    setAutoPreview(nextVal);
    localStorage.setItem("setting_auto_preview", String(nextVal));
  };

  const toggleEmailNotifs = () => {
    const nextVal = !emailNotifications;
    setEmailNotifications(nextVal);
    localStorage.setItem("setting_email_notifs", String(nextVal));
  };

  const handleSignOut = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    router.push("/login");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const totalCapacity = 15 * 1024 * 1024 * 1024; // 15 GB
  const percentage = Math.min(100, Math.max(0.5, (storageUsedBytes / totalCapacity) * 100));

  return (
    <div className="w-full space-y-8 text-slate-200">
      {/* Header */}
      <div className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.35)]">
              {name.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{name}</h1>
              <p className="text-xs text-[#7D879C] mt-1">{email} • Personal Account</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Account Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information */}
          <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Profile Information</h2>
                  <p className="text-xs text-[#7D879C]">Update your account display name and preferences.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D879C] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#7D879C] focus:outline-none focus:border-[#8B5CF6] transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D879C] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl bg-white/5 border border-white/5 pl-10 pr-4 py-2.5 text-sm text-[#7D879C] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {profileSaved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Profile changes saved successfully!</span>
                  </div>
                )}
                {!profileSaved && <div />}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Security & Password */}
          <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Security & Password</h2>
                  <p className="text-xs text-[#7D879C]">Manage your credentials and login protection.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D879C] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#7D879C] focus:outline-none focus:border-[#06B6D4] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D879C] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#7D879C] focus:outline-none focus:border-[#06B6D4] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7D879C] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D879C]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#7D879C] focus:outline-none focus:border-[#06B6D4] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/15 px-5 py-2.5 text-xs font-medium text-white hover:bg-white/10 hover:border-white/25 transition-all"
                >
                  <Shield className="h-4 w-4 text-[#06B6D4]" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </section>

          {/* Preferences */}
          <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">App Preferences</h2>
                  <p className="text-xs text-[#7D879C]">Configure viewing modes and system behaviors.</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {/* Auto Preview */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm text-white">Media In-App Preview</p>
                  <p className="text-xs text-[#7D879C] mt-0.5">Enable instant popup previews for images and PDF documents.</p>
                </div>
                <button
                  onClick={toggleAutoPreview}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoPreview ? "bg-[#8B5CF6]" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoPreview ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm text-white">Security Alerts & Notifications</p>
                  <p className="text-xs text-[#7D879C] mt-0.5">Receive notifications when files are shared or modified.</p>
                </div>
                <button
                  onClick={toggleEmailNotifs}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? "bg-[#8B5CF6]" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-8">
          {/* Storage & Tier */}
          <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D879C]">Current Plan</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#C4B5FD] text-[11px] font-semibold">
                Free Tier
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-white">{formatBytes(storageUsedBytes)}</h3>
                <span className="text-xs text-[#7D879C]">of 15.0 GB</span>
              </div>
              <div className="mt-3 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[11px] text-[#7D879C] mt-2">
                Cloudinary CDN integration enabled with automated optimization.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-[#B7C1D8]">
              <div className="flex justify-between">
                <span>Multi-region storage</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Soft-delete Trash</span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>SSL / TLS Encryption</span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="rounded-[24px] bg-[rgba(22,27,48,0.72)] backdrop-blur-[20px] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.28)] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">Account Session</h3>
            <p className="text-xs text-[#7D879C]">
              Sign out of this browser session or manage your active credentials.
            </p>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out of Account</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
