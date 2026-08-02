"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Home, Folder, File, Trash, Star, Settings } from 'lucide-react'; // Assuming lucide-react for icons

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
    { name: 'My Files', href: '/files', icon: <Folder size={20} /> },
    { name: 'Shared', href: '/shared', icon: <File size={20} /> },
    { name: 'Favorites', href: '/favorites', icon: <Star size={20} /> },
    { name: 'Trash', href: '/trash', icon: <Trash size={20} /> },
  ];

  return (
    <aside className="w-64 bg-[#0B0B13]/80 backdrop-blur-md border-r border-white/10 hidden md:flex flex-col">
      <div className="p-6 flex items-center justify-center">
      <Image 
        src="/logo.png" 
        alt="CloudRage Logo" 
        width={160} 
        height={60} 
        className="w-36 drop-shadow-md" 
        priority
      />
    </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;