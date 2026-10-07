'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ChefHat, ClipboardList, TrendingUp, Settings, LogOut, Menu as MenuIcon, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Kitchen', href: '/admin/kitchen', icon: ChefHat },
  { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { name: 'Menu & Prices', href: '/admin/menu', icon: MenuIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-[#161616] border-b border-[#2a2a2a] p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 font-bold text-xl text-white">
          <img src="/logo.png" alt="Amols Cafe Logo" className="h-10 w-auto object-contain shrink-0" />
          <span><span className="text-[#F58A1F]">Amol's</span> Admin</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          <MenuIcon size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-[#161616] border-r border-[#2a2a2a]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full
      `}>
        <div className="p-6 hidden md:block border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Amols Cafe Logo" className="h-10 w-auto object-contain shrink-0" />
            <div>
              <div className="font-bold text-xl tracking-tight text-white leading-tight">
                <span className="text-[#F58A1F]">Amol's</span> Admin
              </div>
              <p className="text-xs text-[#B5B5B5]">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-[#F58A1F] text-white' 
                    : 'text-[#B5B5B5] hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2a2a2a] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-blue-400 hover:bg-blue-400/10 transition-colors font-medium"
          >
            <ExternalLink size={20} />
            View Customer Site
          </Link>
          <button 
            onClick={() => {
              import('@/lib/firebase').then(({ auth }) => {
                import('firebase/auth').then(({ signOut }) => signOut(auth));
              });
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-500 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
