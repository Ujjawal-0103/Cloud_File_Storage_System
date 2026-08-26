"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Folder,
  Share2,
  HardDrive,
  LogOut,
  Star,
  Trash2,
  FileText,
  ImageIcon,
  FileArchive,
} from "lucide-react";
import FileManager from "@/components/file-manager/FileManager";

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");

 useEffect(() => {
    const savedName = localStorage.getItem("user_name");
    if (savedName) {
      setUserName(savedName);
    }
  }, []);


  const handleSignOut = () => {
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/login");
  };

  const recentFiles = [
    {
      icon: FileText,
      name: "Resume.pdf",
      size: "2.1 MB",
      date: "Today",
    },
    {
      icon: ImageIcon,
      name: "Logo.png",
      size: "580 KB",
      date: "Yesterday",
    },
    {
      icon: FileArchive,
      name: "Project.zip",
      size: "25 MB",
      date: "2 days ago",
    },
  ];

  return (
    <div className="space-y-8 min-h-screen bg-[#12162A] p-6 lg:p-10 text-white">

      {/* ================= HERO ================= */}
      <section
        className="
          rounded-3xl
          bg-[rgba(22,27,48,.72)]
          backdrop-blur-[20px]
          border
          border-white/10
          shadow-[0_15px_40px_rgba(0,0,0,.28)]
          p-10
        "
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">{userName}</span>
              </h1>
              <p className="text-[#B7C1D8] mt-3 text-lg">
                Manage, upload and organize your files securely in CloudVault.
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="
              flex
              items-center
              gap-2
              rounded-2xl
              px-7
              py-4
              bg-gradient-to-r
              from-[#8B5CF6]
              via-[#6366F1]
              to-[#06B6D4]
              text-white
              font-semibold
              hover:scale-105
              transition-all
            "
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-[rgba(22,27,48,.72)] backdrop-blur-[20px] border border-white/10 p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#B7C1D8]">Storage Used</p>
              <h2 className="text-4xl font-bold text-white mt-3">0 GB</h2>
              <p className="text-[#7D879C] mt-2">of 15 GB available</p>
            </div>
            <HardDrive size={40} className="text-[#8B5CF6]" />
          </div>
          <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
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

        <div className="rounded-3xl bg-[rgba(22,27,48,.72)] backdrop-blur-[20px] border border-white/10 p-7">
          <Folder size={34} className="text-[#8B5CF6]" />
          <h2 className="text-4xl text-white font-bold mt-6">0</h2>
          <p className="text-[#B7C1D8] mt-3">Total Files</p>
        </div>

        <div className="rounded-3xl bg-[rgba(22,27,48,.72)] backdrop-blur-[20px] border border-white/10 p-7">
          <Share2 size={34} className="text-[#06B6D4]" />
          <h2 className="text-4xl text-white font-bold mt-6">0</h2>
          <p className="text-[#B7C1D8] mt-3">Shared Files</p>
        </div>

        <div className="rounded-3xl bg-[rgba(22,27,48,.72)] backdrop-blur-[20px] border border-white/10 p-7">
          <Star size={34} className="text-yellow-400" />
          <h2 className="text-4xl text-white font-bold mt-6">0</h2>
          <p className="text-[#B7C1D8] mt-3">Favorites</p>
        </div>
      </section>

      {/* ================= FILE MANAGER ================= */}
      <section className="rounded-3xl bg-[rgba(22,27,48,.72)] backdrop-blur-[20px] border border-white/10 p-8 shadow-[0_15px_40px_rgba(0,0,0,.28)]">
        <FileManager />
      </section>

      {/* ================= RECENT FILES ================= */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Recent Files</h2>
        <div
          className="
            rounded-3xl
            bg-[rgba(22,27,48,.72)]
            backdrop-blur-[20px]
            border
            border-white/10
            shadow-[0_15px_40px_rgba(0,0,0,.28)]
            overflow-hidden
          "
        >
          {recentFiles.map((file, index) => {
            const Icon = file.icon;
            return (
              <div
                key={file.name}
                className={`
                  flex
                  items-center
                  justify-between
                  px-8
                  py-6
                  ${
                    index !== recentFiles.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }
                `}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="
                      h-12
                      w-12
                      rounded-xl
                      bg-white/5
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Icon size={22} className="text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{file.name}</h3>
                    <p className="text-[#7D879C] text-sm mt-1">{file.date}</p>
                  </div>
                </div>
                <span className="text-[#B7C1D8]">{file.size}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= STORAGE SUMMARY ================= */}
      <section>
        <div
          className="
            rounded-3xl
            bg-[rgba(22,27,48,.72)]
            backdrop-blur-[20px]
            border
            border-white/10
            p-8
            shadow-[0_15px_40px_rgba(0,0,0,.28)]
          "
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white text-2xl font-bold">Storage Overview</h2>
              <p className="text-[#B7C1D8] mt-2">
                You're currently using
                <span className="text-white font-semibold"> 0 GB </span>
                of your 15 GB storage.
              </p>
            </div>
            <Trash2 size={42} className="text-[#06B6D4]" />
          </div>
          <div className="mt-8 h-3 rounded-full bg-white/10 overflow-hidden">
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
      </section>

    </div>
  );
}