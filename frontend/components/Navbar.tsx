"use client";

import { useState, useEffect } from "react";
import { Bell, Search, User, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [userName, setUserName] = useState("Tanmay Singhal");

  useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  return (
    <header
      className="
        sticky
        top-0
        z-50
        h-20
        flex
        items-center
        justify-between
        px-8
        bg-[rgba(22,27,48,.72)]
        backdrop-blur-[20px]
        border-b
        border-white/10
        shadow-[0_15px_40px_rgba(0,0,0,.28)]
      "
    >
      {/* Right Section */}
      <div className="flex items-center gap-5">
        {/* Profile */}
        <button
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            px-2
            py-1
            hover:bg-white/5
            transition-all
          "
        >
          <div
            className="
              w-11
              h-11
              rounded-full
              bg-gradient-to-r
              from-[#8B5CF6]
              via-[#6366F1]
              to-[#06B6D4]
              flex
              items-center
              justify-center
            "
          >
            <User
              size={18}
              className="text-white"
            />
          </div>

          <div className="hidden sm:block text-left">
            <h3 className="text-white font-semibold">
              {userName}
            </h3>
            <p className="text-sm text-[#B7C1D8]">
              Free Plan
            </p>
          </div>

          <ChevronDown
            size={18}
            className="text-[#7D879C]"
          />
        </button>

        {/* Divider */}
        <div className="h-10 w-px bg-white/10" />

        {/* Notification */}
        <button
          className="
            relative
            w-11
            h-11
            rounded-full
            bg-white/5
            border
            border-white/10
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition-all
          "
        >
          <Bell
            size={19}
            className="text-[#B7C1D8]"
          />
          <span
            className="
              absolute
              top-2
              right-2
              w-2.5
              h-2.5
              rounded-full
              bg-[#06B6D4]
            "
          />
        </button>

        
        
      </div>
    </header>
  );
};

export default Navbar;