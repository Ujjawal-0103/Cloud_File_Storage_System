"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Menu,
  X,
  Home,
  Folder,
  Share2,
  Star,
  Trash2,
  Clock,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import SignOutModal from "./SignOutModal";
import NotificationsMenu from "./NotificationsMenu";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      try {
        const savedName = localStorage.getItem("user_name");
        const savedEmail = localStorage.getItem("user_email");
        if (savedName) setUserName(savedName);
        if (savedEmail) setUserEmail(savedEmail);
      } catch {
        // Ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Close menus on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsProfileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/files?q=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  const handleSignOutClick = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = () => {
    setIsSignOutModalOpen(false);
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    try {
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
    } catch {
      // Ignore
    }
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Files", href: "/files", icon: Folder },
    { name: "Recent", href: "/recent", icon: Clock },
    { name: "Shared", href: "/shared", icon: Share2 },
    { name: "Favorites", href: "/favorites", icon: Star },
    { name: "Trash", href: "/trash", icon: Trash2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-[#070B16]/90 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
        {/* Left: Mobile Menu Trigger + Breadcrumb/App Name */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="flex md:hidden items-center space-x-2 mr-1">
            <Image
              src="/logo.png"
              alt="CloudRage"
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-foreground text-sm tracking-tight">CloudRage</span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground capitalize">
              {pathname.split("/")[1] || "Dashboard"}
            </span>
            {pathname.includes("/files/") && (
              <>
                <span>/</span>
                <span className="text-muted-foreground">Folder</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search in files, folders..."
              className="w-full h-9 pl-9 pr-4 text-xs bg-slate-100/70 dark:bg-[#040711] hover:bg-slate-100 dark:hover:bg-[#060A16] focus:bg-white dark:focus:bg-[#040711] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-xl text-foreground placeholder:text-muted-foreground transition-all outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </form>
        </div>

        {/* Right: Theme Toggle + Notifications + User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300 animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <NotificationsMenu />

          <div className="h-5 w-px bg-border" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer"
              aria-label="User account menu"
              aria-expanded={isProfileOpen}
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground leading-none">{userName}</p>
                <p className="text-[11px] text-muted-foreground leading-none mt-1">Personal Plan</p>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-popover border border-border shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-popover-foreground">
                <div className="px-3.5 py-2.5 border-b border-border">
                  <p className="font-semibold text-foreground truncate">{userName}</p>
                  {userEmail && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</p>}
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 px-3.5 py-2 text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleSignOutClick}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/50 backdrop-blur-xs flex animate-in fade-in duration-200">
          <div className="w-64 bg-card text-card-foreground h-full p-4 flex flex-col justify-between shadow-2xl border-r border-border animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center space-x-2.5">
                  <Image
                    src="/logo.png"
                    alt="CloudRage"
                    width={38}
                    height={38}
                    className="h-9 w-9 object-contain shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">CloudRage</span>
                    <span className="text-[10px] text-muted-foreground">Cloud Storage</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-xl transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-2.5">
                  {mounted && theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-600" />
                  )}
                  <span>Appearance</span>
                </span>
                <span className="text-[11px] font-semibold capitalize text-foreground">
                  {mounted ? theme : "light"}
                </span>
              </button>

              <button
                onClick={handleSignOutClick}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Accessible Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
      />
    </>
  );
}