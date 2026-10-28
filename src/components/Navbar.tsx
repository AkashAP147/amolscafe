'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, ShoppingBag, Info, Shield, UtensilsCrossed } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = useCartStore((state) => state.getCartCount());
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const navLinks = user 
    ? [{ name: 'Menu', href: '/menu' }] 
    : [
        { name: 'Home', href: '/' },
        { name: 'About & Contact', href: '/about' },
      ];

  const homeHref = user ? '/menu' : '/';

  // Handle physical / browser back button so pressing back closes the mobile drawer instead of leaving the page
  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ menuOpen: true }, '');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobileMenuOpen]);

  // Close menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Left: Menu Toggle Button (only when logged in) */}
          {user && (
            <div className="flex md:hidden items-center">
              <button
                onClick={() => isMobileMenuOpen ? closeMobileMenu() : openMobileMenu()}
                className="text-[#B5B5B5] hover:text-white p-2 rounded-xl border border-[#2a2a2a] bg-[#161616] focus:outline-none focus:border-[#F58A1F] transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}

          {/* Logo (Centered or aligned next to menu button on mobile, left on desktop) */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={homeHref} className="flex items-center gap-2 z-50">
              <img src="/logo.png" alt="Amols Cafe Logo" className="h-10 w-auto object-contain shrink-0" />
              <span className="font-bold text-2xl tracking-tight text-white block">
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

          {/* Icons: Cart & Profile (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            {user?.email === 'amolscafe@gmail.com' && (
              <Link
                href="/admin/kitchen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F58A1F]/15 text-[#F58A1F] border border-[#F58A1F]/30 hover:bg-[#F58A1F] hover:text-white transition-all shadow-sm"
              >
                <Shield size={14} /> Admin Corner
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-[#B5B5B5] hover:text-white transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#161616] border border-[#2a2a2a] flex items-center justify-center text-[#F58A1F]">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium hidden lg:block">{user.displayName?.split(' ')[0] || 'Profile'}</span>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-52 bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#2a2a2a] mb-2">
                      <p className="text-sm text-white font-medium truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-[#B5B5B5] truncate">{user.email}</p>
                    </div>
                    <Link href="/my-orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#B5B5B5] hover:text-white hover:bg-[#2a2a2a] transition-colors">
                      <ShoppingBag size={16} /> My Orders
                    </Link>
                    <Link href="/about" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#B5B5B5] hover:text-white hover:bg-[#2a2a2a] transition-colors">
                      <Info size={16} /> About & Contact
                    </Link>
                    {user?.email === 'amolscafe@gmail.com' && (
                      <Link href="/admin/kitchen" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-[#F58A1F] hover:bg-[#2a2a2a] transition-colors font-medium">
                        <Shield size={16} /> Admin Corner
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

          {/* Mobile Right: Cart icon, Admin shortcut & Sign In */}
          <div className="md:hidden flex items-center gap-2">
            {user?.email === 'amolscafe@gmail.com' && (
              <Link
                href="/admin/kitchen"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F58A1F]/15 text-[#F58A1F] border border-[#F58A1F]/30"
                title="Admin Corner"
              >
                <Shield size={13} /> Admin
              </Link>
            )}
            {user ? (
              <Link href="/cart" className="relative text-white p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F58A1F] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link href="/login" className="text-xs font-bold text-white bg-[#F58A1F] px-3 py-2 rounded-xl">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

    </nav>

    {/* Mobile Drawer Backdrop & Left Slide-out Panel mounted to body via portal */}
    {mounted && isMobileMenuOpen && user && createPortal(
      <div className="md:hidden fixed inset-0 z-[9999] flex">
        {/* Full-screen Dark Backdrop */}
        <div 
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Drawer sliding in from the left: strictly full viewport height */}
        <div className="relative w-4/5 max-w-[300px] bg-[#161616] border-r border-[#2a2a2a] h-[100dvh] shadow-2xl flex flex-col z-[10000] animate-in slide-in-from-left duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Amols Cafe Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-lg text-white">
                <span className="text-[#F58A1F]">Amol's</span> Cafe
              </span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-1.5 rounded-lg text-[#B5B5B5] hover:text-white hover:bg-[#242424] transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User profile snippet */}
          <div className="px-5 py-4 border-b border-[#2a2a2a] bg-[#121212] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#242424] border border-[#333] flex items-center justify-center text-[#F58A1F] font-bold shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{user.displayName || 'Customer'}</p>
                <p className="text-xs text-[#888] truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 min-h-0">
            <Link
              href="/menu"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/menu'
                  ? 'text-[#F58A1F] bg-[#0B0B0B] font-bold'
                  : 'text-[#B5B5B5] hover:text-white hover:bg-[#0B0B0B]'
              }`}
            >
              <UtensilsCrossed size={18} /> Menu
            </Link>
            <Link
              href="/my-orders"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/my-orders'
                  ? 'text-[#F58A1F] bg-[#0B0B0B] font-bold'
                  : 'text-[#B5B5B5] hover:text-white hover:bg-[#0B0B0B]'
              }`}
            >
              <ShoppingBag size={18} /> My Orders
            </Link>
            <Link
              href="/about"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/about'
                  ? 'text-[#F58A1F] bg-[#0B0B0B] font-bold'
                  : 'text-[#B5B5B5] hover:text-white hover:bg-[#0B0B0B]'
              }`}
            >
              <Info size={18} /> About & Contact
            </Link>
            {user?.email === 'amolscafe@gmail.com' && (
              <Link
                href="/admin/kitchen"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'text-[#F58A1F] bg-[#0B0B0B] font-bold'
                    : 'text-[#F58A1F] hover:bg-[#0B0B0B]'
                }`}
              >
                <Shield size={18} /> Admin Corner
              </Link>
            )}
          </div>

          {/* Footer / Sign Out */}
          <div className="p-4 border-t border-[#2a2a2a] bg-[#121212] shrink-0 mt-auto">
            <button
              onClick={() => { handleLogout(); closeMobileMenu(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
