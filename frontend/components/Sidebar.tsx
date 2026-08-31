"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Folder,
  Share2,
  Star,
  Trash2,
  Settings,
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "My Files",
      href: "/files",
      icon: Folder,
    },
    {
      name: "Shared",
      href: "/shared",
      icon: Share2,
    },
    {
      name: "Favorites",
      href: "/favorites",
      icon: Star,
    },
    {
      name: "Trash",
      href: "/trash",
      icon: Trash2,
    },
  ];

  return (
    <aside
      className="
        hidden
        md:flex
        w-72
        flex-col
        justify-between

        bg-[rgba(22,27,48,.72)]
        backdrop-blur-[20px]

        border-r
        border-white/10

        shadow-[0_15px_40px_rgba(0,0,0,.28)]
      "
    >
      {/* Logo */}

      <div>
        <div className="flex justify-center items-center py-8">

          <img
            src="/logo.png"
            alt="CloudRage"
            width={180}
            height={60}
            className="object-contain select-none"
          />

        </div>

        {/* Navigation */}

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              mounted &&
              (pathname === item.href ||
                (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(`${item.href}/`)));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex
                  items-center
                  gap-4
                  px-5
                  py-3.5
                  rounded-2xl
                  transition-all
                  duration-300
                  ${
                    active
                      ? "bg-white/10 border border-[#8B5CF6]/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "text-[#B7C1D8] hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon
                  size={21}
                  className={
                    active
                      ? "text-[#8B5CF6]"
                      : "text-[#7D879C]"
                  }
                />

                <span className="font-medium tracking-wide">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/settings"
          className={`
            flex
            items-center
            gap-4
            px-5
            py-3.5
            rounded-2xl
            transition-all
            duration-300
            ${
              mounted && pathname === "/settings"
                ? "bg-white/10 border border-[#8B5CF6]/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "text-[#B7C1D8] hover:bg-white/5 hover:text-white"
            }
          `}
        >
          <Settings
            size={21}
            className={
              mounted && pathname === "/settings"
                ? "text-[#8B5CF6]"
                : "text-[#7D879C]"
            }
          />

          <span className="font-medium">
            Settings
          </span>
        </Link>

        {/* Storage Card */}

        <div
          className="
            mt-8

            rounded-3xl

            bg-white/5

            border

            border-white/10

            p-5
          "
        >

          <p className="text-sm text-[#B7C1D8]">
            Storage
          </p>

          <h2 className="text-3xl font-bold text-white mt-2">
            0 GB
          </h2>

          <p className="text-xs text-[#7D879C] mt-1">
            of 15 GB available
          </p>

          <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">

            <div
              className="
                h-full
                w-[5%]

                rounded-full

                bg-gradient-to-r
                from-[#8B5CF6]
                via-[#6366F1]
                to-[#06B6D4]
              "
            />

          </div>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;