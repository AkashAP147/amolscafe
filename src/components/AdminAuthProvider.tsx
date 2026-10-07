'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isAdmin = currentUser && currentUser.email && currentUser.email.toLowerCase() === 'amolscafe@gmail.com';
      
      setUser(isAdmin ? currentUser : null);
      
      if (!isAdmin && pathname !== '/admin/login' && pathname.startsWith('/admin')) {
        router.push('/');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F58A1F]" size={48} />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <main className="min-h-screen bg-[#0B0B0B]">{children}</main>;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#0B0B0B] overflow-hidden">
      <AdminSidebar />
      <main className="flex-grow overflow-y-auto bg-[#0B0B0B]">
        {children}
      </main>
    </div>
  );
}
