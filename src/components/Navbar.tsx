'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, FileText, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = useCartStore((state) => state.getCartCount());
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowDropdown(false);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    ...(user ? [{ name: 'Menu', href: '/menu' }] : []),
    { name: 'About & Contact', href: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 z-50">
              <img src="/logo.png" alt="Amols Cafe Logo" className="h-10 w-auto object-contain shrink-0" />
              <span className="font-bold text-2xl tracking-tight text-white hidden sm:block">
                <span className="text-[#F58A1F]">Amol's</span> Cafe
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-[#F58A1F] bg-[#161616]'
                      : 'text-[#B5B5B5] hover:text-white hover:bg-[#161616]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Icons: Cart & Profile */}
          <div className="hidden md:flex items-center space-x-6">
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-[#B5B5B5] hover:text-white transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium hidden lg:block">{user.displayName?.split(' ')[0] || 'Profile'}</span>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#2a2a2a] mb-2">
                      <p className="text-sm text-white font-medium truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-[#B5B5B5] truncate">{user.email}</p>
                    </div>
                    <Link href="/my-orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#B5B5B5] hover:text-white hover:bg-[#2a2a2a] transition-colors">
                      <FileText size={16} /> My Orders
                    </Link>
                    {user?.email === 'amolscafe@gmail.com' && (
                      <Link href="/admin/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#F58A1F] hover:bg-[#2a2a2a] transition-colors">
                        <Shield size={16} /> Admin Portal
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-[#2a2a2a] transition-colors text-left mt-1">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold text-white bg-[#161616] hover:bg-[#2a2a2a] border border-[#2a2a2a] px-5 py-2.5 rounded-xl transition-colors">
                Sign In
              </Link>
            )}
            
            {user && (
              <Link href="/cart" className="relative text-white hover:text-[#F58A1F] transition-colors">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F58A1F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
              <Link href="/cart" className="relative text-white">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F58A1F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#B5B5B5] hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#161616] border-b border-[#2a2a2a] absolute w-full left-0">
          <div className="px-4 pt-4 pb-6 space-y-1">
            
            {user && (
              <div className="px-3 py-4 mb-2 border-b border-[#2a2a2a]">
                <p className="text-white font-medium">{user.displayName || 'Welcome'}</p>
                <p className="text-xs text-[#B5B5B5]">{user.email}</p>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-xl text-base font-medium ${
                  pathname === link.href
                    ? 'text-[#F58A1F] bg-[#0B0B0B]'
                    : 'text-[#B5B5B5] hover:text-white hover:bg-[#0B0B0B]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link
                  href="/my-orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-3 rounded-xl text-base font-medium text-[#B5B5B5] hover:text-white hover:bg-[#0B0B0B]"
                >
                  My Orders
                </Link>
                {user?.email === 'amolscafe@gmail.com' && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-3 rounded-xl text-base font-medium text-[#F58A1F] hover:bg-[#0B0B0B]"
                  >
                    Admin Portal
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-3 rounded-xl text-base font-medium text-red-500 hover:text-red-400 hover:bg-[#0B0B0B]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-xl text-base font-bold text-white bg-[#F58A1F] hover:bg-[#e07a1b] text-center mt-4"
              >
                Sign In / Create Account
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
