'use client';

import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { Bell, ChefHat, CheckCircle2, AlertCircle, X, ArrowRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Safe synthesized Web Audio chime (works cross-platform without external MP3 files)
function playCustomerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.16); // A5
    gain2.gain.setValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Gracefully handle locked audio contexts
  }
}

interface AlertData {
  orderId: string;
  orderNumber?: string | number;
  status: string;
  title: string;
  message: string;
  color: string;
}

export default function CustomerOrderNotifier() {
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const knownStatusesRef = useRef<Record<string, string>>({});
  const initialSyncRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Request permission safely if browser supports it
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {}

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Helper to process an order object
    const handleOrderChange = (order: any, key: string) => {
      if (!order) return;
      const orderId = order.orderId || key;
      const currentStatus = order.orderStatus;
      if (!orderId || !currentStatus) return;

      const prevStatus = knownStatusesRef.current[orderId];

      // If first time seeing this order in this session, record status and do not alert
      if (prevStatus === undefined) {
        knownStatusesRef.current[orderId] = currentStatus;
        return;
      }

      // If status changed to an actionable state
      if (prevStatus !== currentStatus && ['ACCEPTED', 'PREPARING', 'READY', 'CANCELLED'].includes(currentStatus)) {
        knownStatusesRef.current[orderId] = currentStatus;

        let title = '';
        let message = '';
        let color = '#F58A1F';

        if (currentStatus === 'ACCEPTED') {
          title = 'Order Accepted! 👨‍🍳';
          message = `Your order #${order.orderNumber || ''} has been accepted by our kitchen.`;
          color = '#F58A1F';
        } else if (currentStatus === 'PREPARING') {
          title = 'Order in Preparation! 🔥';
          message = `Chefs are now preparing your order #${order.orderNumber || ''}.`;
          color = '#3B82F6';
        } else if (currentStatus === 'READY') {
          title = 'Order is Ready! 🎉';
          message = `Your order #${order.orderNumber || ''} is ready for pickup & payment!`;
          color = '#10B981';
        } else if (currentStatus === 'CANCELLED') {
          title = 'Order Cancelled ⚠️';
          message = order.cancellationReason
            ? `Order #${order.orderNumber || ''} cancelled: ${order.cancellationReason}`
            : `Order #${order.orderNumber || ''} could not be fulfilled.`;
          color = '#EF4444';
        }

        // Avoid double alert if already on this order's page and it fired in last 2 seconds
        const lastLocalAlert = (window as any).__lastOrderAlertTimestamp || 0;
        const now = Date.now();
        (window as any).__lastGlobalCustomerAlert = now;

        if (now - lastLocalAlert > 2000) {
          playCustomerChime();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([200, 100, 200, 100, 400]);
            } catch (e) {}
          }
        }

        setActiveAlert({
          orderId,
          orderNumber: order.orderNumber || orderId,
          status: currentStatus,
          title,
          message,
          color,
        });

        // Safe device notification fallback
        try {
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            typeof Notification === 'function' &&
            Notification.permission === 'granted'
          ) {
            new Notification(title, {
              body: message,
              icon: '/logo.png',
            });
          }
        } catch (e) {}
      } else {
        knownStatusesRef.current[orderId] = currentStatus;
      }
    };

    // 1. If user is logged in, listen to their orders
    if (currentUser?.uid) {
      const userOrdersQuery = query(
        ref(db, 'orders'),
        orderByChild('userId'),
        equalTo(currentUser.uid)
      );

      const unsubUser = onValue(userOrdersQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach((key) => {
            handleOrderChange(data[key], key);
          });
        }
      });
      unsubs.push(unsubUser);
    }

    // 2. Also listen to any recent orders placed on this device stored in localStorage
    try {
      const recentIds: string[] = JSON.parse(
        localStorage.getItem('amolscafe_recent_orders') || '[]'
      );
      recentIds.slice(0, 3).forEach((id) => {
        const singleOrderRef = ref(db, `orders/${id}`);
        const unsubSingle = onValue(singleOrderRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            handleOrderChange(data, id);
          }
        });
        unsubs.push(unsubSingle);
      });
    } catch (e) {}

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUser]);

  // Auto-dismiss alert after 12 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <ChefHat size={18} className="text-white" />;
      case 'PREPARING':
        return <Flame size={18} className="text-white" />;
      case 'READY':
        return <CheckCircle2 size={18} className="text-white" />;
      case 'CANCELLED':
        return <AlertCircle size={18} className="text-white" />;
      default:
        return <Bell size={18} className="text-white" />;
    }
  };

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] bg-[#161616]/95 backdrop-blur-xl border-2 shadow-[0_10px_35px_rgba(0,0,0,0.5)] rounded-2xl p-4 text-white"
          style={{ borderColor: activeAlert.color }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg animate-pulse"
              style={{ backgroundColor: activeAlert.color }}
            >
              {getStatusIcon(activeAlert.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: activeAlert.color }}
                >
                  {activeAlert.title}
                </span>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="text-[#888] hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[#E5E5E5] mt-1 leading-relaxed">
                {activeAlert.message}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/order/${activeAlert.orderId}`}
                  onClick={() => setActiveAlert(null)}
                  className="flex-1 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 text-white"
                  style={{ backgroundColor: activeAlert.color }}
                >
                  Track Order <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="bg-[#242424] hover:bg-[#333] text-[#B5B5B5] hover:text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
