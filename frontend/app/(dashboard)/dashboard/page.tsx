"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const handleSignOut = () => {
    // Delete the authentication cookie
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    // Redirect to login page
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0B0A1A] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-wide">CloudVault</h1>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </header>

        {/* Main Content Area */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Welcome Card (Sprint Box removed) */}
          <div className="col-span-1 md:col-span-2 bg-[#131127] border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to your Dashboard!</h2>
            <p className="text-gray-400">
              You have successfully routed to the protected dashboard. From here, you will be able to manage your folders, upload files, and monitor your cloud storage.
            </p>
          </div>

          {/* Quick Stats Card */}
          <div className="col-span-1 bg-[#131127] border border-white/5 rounded-2xl p-8 shadow-xl flex flex-col justify-center">
            <h3 className="text-gray-400 font-medium mb-2">Storage Used</h3>
            <div className="text-4xl font-bold text-white mb-2">0 GB</div>
            <p className="text-sm text-gray-500">of 15 GB available</p>
            
            {/* Progress bar mock */}
            <div className="w-full h-2 bg-gray-800 rounded-full mt-6 overflow-hidden">
              <div className="w-[5%] h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}