"use client";
import { Search, Bell, User } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-20 flex items-center justify-between px-6 bg-transparent border-b border-white/5">
      {/* Mobile Menu Trigger (Visible only on small screens) */}
      <div className="md:hidden flex items-center">
        <span className="text-xl font-bold">CloudRage</span>
      </div>

      {/* Global Search Placeholder (Sprint 5/9 Feature) */}
      <div className="hidden md:flex items-center flex-1 max-w-md bg-white/5 border border-white/10 rounded-full px-4 py-2">
        <Search size={18} className="text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="Search files, folders..." 
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-400"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition">
          <Bell size={20} />
        </button>
        
        {/* User Profile Dropdown Placeholder */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-white">John Doe</p>
            <p className="text-gray-400 text-xs">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;