"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Key,
  HardDrive,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sliders,
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
    } catch {
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
    } catch {
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
  const percentage = Math.min(100, Math.max(storageUsedBytes > 0 ? 0.5 : 0, (storageUsedBytes / totalCapacity) * 100));

  return (
    <div className="w-full space-y-8 text-slate-800">
      {/* Header Profile Summary */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-xs">
              {name.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{email} • Personal Account</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Account Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Profile Information</h2>
                  <p className="text-xs text-slate-500">Update your account display name.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {profileSaved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Profile saved successfully!</span>
                  </div>
                )}
                {!profileSaved && <div />}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Security & Password */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Security & Password</h2>
                  <p className="text-xs text-slate-500">Change your password to keep your account secure.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                >
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </section>

          {/* Preferences */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Sliders className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">App Preferences</h2>
                  <p className="text-xs text-slate-500">Configure viewing behavior and security notifications.</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Auto Preview */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm text-slate-900">Media In-App Preview</p>
                  <p className="text-xs text-slate-500 mt-0.5">Enable instant popup previews for images and PDF documents.</p>
                </div>
                <button
                  onClick={toggleAutoPreview}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoPreview ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                      autoPreview ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm text-slate-900">Security Alerts & Notifications</p>
                  <p className="text-xs text-slate-500 mt-0.5">Receive notifications when files are shared or modified.</p>
                </div>
                <button
                  onClick={toggleEmailNotifs}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    emailNotifications ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
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
          <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Plan</span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                Personal
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{formatBytes(storageUsedBytes)}</h3>
                <span className="text-xs text-slate-500">of 15.0 GB</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.max(1, percentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Cloud CDN integration enabled with automated format optimization.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Multi-region storage</span>
                <span className="text-emerald-700 font-semibold">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Soft-delete Trash</span>
                <span className="text-emerald-700 font-semibold">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>SSL / TLS Encryption</span>
                <span className="text-emerald-700 font-semibold">Enabled</span>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Account Session</h3>
            <p className="text-xs text-slate-500">
              Sign out of this browser session to close active credentials.
            </p>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors shadow-xs"
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
