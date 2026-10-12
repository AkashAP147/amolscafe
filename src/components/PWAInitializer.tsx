'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInitializer() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA ServiceWorker registered with scope:', registration.scope);

            // Request Notification Permission on PWA registration
            if ('Notification' in window && Notification.permission === 'default') {
              // Delay slightly so user isn't overwhelmed immediately
              setTimeout(() => {
                Notification.requestPermission().catch(() => {});
              }, 4000);
            }
          })
          .catch((err) => {
            console.warn('PWA ServiceWorker registration failed:', err);
          });
      });
    }

    // 2. Listen for BeforeInstallPrompt event (mobile Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed today
      const dismissedTime = localStorage.getItem('amolscafe_pwa_dismissed');
      if (!dismissedTime || Date.now() - Number(dismissedTime) > 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('amolscafe_pwa_dismissed', String(Date.now()));
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9990] bg-[#161616]/95 backdrop-blur-xl border border-[#F58A1F]/40 shadow-[0_10px_35px_rgba(245,138,31,0.25)] rounded-2xl p-4 text-white animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Amol's Cafe App"
          className="w-12 h-12 rounded-xl object-contain bg-[#0B0B0B] p-1 border border-[#333] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white truncate">Install Amol's Cafe App</h4>
          <p className="text-xs text-[#B5B5B5] mt-0.5 leading-snug">
            Add to home screen for fast offline ordering and instant order status alerts!
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#888] hover:text-white p-1 rounded-lg shrink-0"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 bg-[#F58A1F] hover:bg-[#e07a1b] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#F58A1F]/20 active:scale-95"
        >
          <Download size={14} /> Install Mobile App
        </button>
        <button
          onClick={handleDismiss}
          className="bg-[#242424] hover:bg-[#2e2e2e] text-[#B5B5B5] hover:text-white text-xs font-medium py-2.5 px-3 rounded-xl transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
