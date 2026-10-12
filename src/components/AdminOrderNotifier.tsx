'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Bell, ChefHat, X, ExternalLink, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Safe synthesized Web Audio chime
function playAdminChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // First tone (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (C6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.50, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio might require user interaction, ignore safely
  }
}

export default function AdminOrderNotifier() {
  const [activeAlert, setActiveAlert] = useState<{
    orderId: string;
    orderNumber?: string | number;
    customerName?: string;
    tableNumber?: string | number;
    total: number;
    itemCount?: number;
    createdAt: number;
  } | null>(null);

  const initialLoadRef = useRef(true);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request permission safely if browser supports it
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {}

    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const orderList = Object.keys(data).map(key => ({
        ...data[key],
        orderKey: key
      }));

      // On initial load, record all existing order IDs to avoid spamming past orders
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        orderList.forEach(o => {
          const id = o.orderId || o.orderKey;
          if (id) seenOrderIdsRef.current.add(id);
        });
        return;
      }

      // Check for newly arrived PENDING orders
      const newPending = orderList.filter(o => {
        const id = o.orderId || o.orderKey;
        return o.orderStatus === 'PENDING' && id && !seenOrderIdsRef.current.has(id);
      });

      if (newPending.length > 0) {
        // Mark as seen
        newPending.forEach(o => {
          const id = o.orderId || o.orderKey;
          if (id) seenOrderIdsRef.current.add(id);
        });

        // Take the latest order
        const latest = newPending[newPending.length - 1];
        
        // 1. Play synthesized chime
        playAdminChime();

        // 2. Vibrate on mobile
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200, 100, 400]);
          } catch (e) {}
        }

        // 3. Set visual floating banner
        setActiveAlert({
          orderId: latest.orderId || latest.orderKey,
          orderNumber: latest.orderNumber || latest.orderId || latest.orderKey,
          customerName: latest.customerName || 'Customer',
          tableNumber: latest.tableNumber,
          total: latest.total || 0,
          itemCount: latest.items ? latest.items.length : undefined,
          createdAt: latest.createdAt || Date.now()
        });

        // 4. Safe System Notification
        try {
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            typeof Notification === 'function' &&
            Notification.permission === 'granted'
          ) {
            new Notification('🔔 New Order Received!', {
              body: `Order #${latest.orderNumber || ''} • ${latest.customerName || 'Customer'} • ₹${latest.total}`,
              icon: '/logo.png'
            });
          }
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] bg-[#161616]/95 backdrop-blur-xl border-2 border-[#F58A1F] shadow-[0_10px_35px_rgba(245,138,31,0.35)] rounded-2xl p-4 text-white"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F58A1F] flex items-center justify-center shrink-0 shadow-lg shadow-[#F58A1F]/30 animate-pulse">
              <Bell className="text-white" size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F58A1F] flex items-center gap-1">
                  <Volume2 size={12} /> New Order Received
                </span>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="text-[#888] hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <h4 className="font-bold text-base text-white truncate mt-0.5">
                Order #{activeAlert.orderNumber}
              </h4>

              <p className="text-xs text-[#B5B5B5] mt-0.5">
                {activeAlert.customerName} •{' '}
                {activeAlert.tableNumber ? `Table ${activeAlert.tableNumber}` : 'Takeaway'} •{' '}
                <span className="text-[#F58A1F] font-semibold">₹{activeAlert.total}</span>
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/admin/kitchen"
                  onClick={() => setActiveAlert(null)}
                  className="flex-1 bg-[#F58A1F] hover:bg-[#e07a1b] text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-[#F58A1F]/20"
                >
                  <ChefHat size={14} /> Open Kitchen Screen
                </Link>
                <Link
                  href="/admin/orders"
                  onClick={() => setActiveAlert(null)}
                  className="bg-[#242424] hover:bg-[#333] text-[#B5B5B5] hover:text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
                >
                  Orders <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
