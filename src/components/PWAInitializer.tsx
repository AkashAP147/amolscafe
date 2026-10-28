'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';

export default function PWAInitializer() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;

    // 1. When the service worker controller changes (new deploy activated), reload to show updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        setUpdating(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });

    // 2. Register Service Worker with active auto-update lifecycle
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA ServiceWorker registered:', registration.scope);

        // Immediate update check
        registration.update().catch(() => {});

        // Listen for new service worker being installed (new deploy published)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Tell the new service worker to skip waiting immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Auto-check for updates whenever the customer returns to the app / refocuses tab
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };

        const handleFocus = () => {
          registration.update().catch(() => {});
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        // Check for updates periodically (every 10 minutes)
        const updateInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 10 * 60 * 1000);

        // Request Notification Permission safely after a short delay
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(() => {
            Notification.requestPermission().catch(() => {});
          }, 4000);
        }

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleFocus);
          clearInterval(updateInterval);
        };
      } catch (err) {
        console.warn('PWA ServiceWorker registration failed:', err);
      }
    };

    registerServiceWorker();

    // 3. Listen for BeforeInstallPrompt event (mobile Chrome, Edge, etc.)
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

  return (
    <>
      {/* Updating Toast Banner */}
      {updating && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#F58A1F] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
          <RefreshCw size={14} className="animate-spin" />
          <span>Updating Amol's Cafe to latest version...</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
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
                Add to home screen for fast ordering and instant order status alerts!
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
      )}
    </>
  );
}
