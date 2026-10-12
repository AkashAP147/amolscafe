'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CheckCircle2, Clock, ChefHat, PackageCheck, ShoppingBag, XCircle, AlertTriangle, Lock, BellRing, Sparkles, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

import { Suspense } from 'react';

import { useAuth } from '@/context/AuthContext';

function OrderTracker() {
  const { orderId } = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Cross-platform popup banner state
  const [liveAlert, setLiveAlert] = useState<{
    title: string;
    message: string;
    type: 'ready' | 'cancelled';
  } | null>(null);

  useEffect(() => {
    // Only redirect to login if auth has finished loading and there is indeed no user
    if (!authLoading && !currentUser) {
      router.push(`/login?redirect=/order/${orderId}`);
    }
  }, [authLoading, currentUser, orderId, router]);

  const [hasNotifiedAccepted, setHasNotifiedAccepted] = useState(false);
  const [hasNotifiedReady, setHasNotifiedReady] = useState(false);
  const [hasNotifiedCancelled, setHasNotifiedCancelled] = useState(false);
  const [hasNotifiedCompleted, setHasNotifiedCompleted] = useState(false);

  // Trigger alert safely across all devices (Android, iOS Safari, desktop)
  const triggerDeviceAlert = (title: string, message: string, type: 'ready' | 'cancelled') => {
    try {
      (window as any).__lastOrderAlertTimestamp = Date.now();
    } catch (e) {}

    // 1. In-app prominent banner (100% works on Android and iOS Safari)
    setLiveAlert({ title, message, type });

    // 2. Device vibration if supported (Android & mobile browsers)
    try {
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (e) {}

    // 3. Audio alert via synthesized Web Audio (zero network/404 dependency)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'ready' ? 784 : 440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {}

    // 4. Safe System Notification fallback (only if granted and not throwing constructor error)
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        typeof Notification === 'function' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, {
            body: message,
            icon: '/logo.png'
          });
        } catch (err) {
          if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, {
                body: message,
                icon: '/logo.png'
              });
            }).catch(() => {});
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (order?.orderStatus === 'ACCEPTED' && !hasNotifiedAccepted) {
      triggerDeviceAlert(
        "Order Confirmed!",
        "Your order has been picked and accepted by Amol's Cafe!",
        'ready'
      );
      setHasNotifiedAccepted(true);
    }

    if (order?.orderStatus === 'READY' && !hasNotifiedReady) {
      triggerDeviceAlert(
        "Order Ready!",
        "Your order is hot and ready for pickup at the counter!",
        'ready'
      );
      setHasNotifiedReady(true);
    }

    if (order?.orderStatus === 'COMPLETED' && !hasNotifiedCompleted) {
      triggerDeviceAlert(
        "Order Delivered!",
        "Thank you for visiting Amol's Cafe.",
        'ready'
      );
      setHasNotifiedCompleted(true);
    }

    if (order?.orderStatus === 'CANCELLED' && !hasNotifiedCancelled) {
      triggerDeviceAlert(
        "Order Rejected",
        order.cancellationReason || "Sorry, your order could not be accepted.",
        'cancelled'
      );
      setHasNotifiedCancelled(true);
    }
  }, [order?.orderStatus, order?.cancellationReason, hasNotifiedAccepted, hasNotifiedReady, hasNotifiedCompleted, hasNotifiedCancelled]);

  useEffect(() => {
    if (!orderId || !currentUser) return;
    
    const orderRef = ref(db, `orders/${orderId}`);
    const unsubscribe = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        setOrder(snapshot.val());
      } else {
        setOrder(null);
      }
      setLoading(false);
    });

    const paymentRef = ref(db, 'settings/payment');
    onValue(paymentRef, (snapshot) => {
      if (snapshot.exists()) {
        setPaymentSettings(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [orderId, currentUser]);

  const handlePayWithCash = async () => {
    try {
      await update(ref(db, `orders/${orderId}`), {
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING'
      });
    } catch (error) {
      console.error("Failed to update payment method:", error);
    }
  };

  if (authLoading || (loading && currentUser)) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F58A1F]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500">
          <Lock size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Login Required</h1>
        <p className="text-[#B5B5B5] max-w-sm mb-6">
          Please log in to your account to view this order&apos;s live status and details.
        </p>
        <Link
          href={`/login?redirect=/order/${orderId}`}
          className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#F58A1F]/20"
        >
          Login to View Order
        </Link>
      </div>
    );
  }

  // Check if order belongs to user or user is admin
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === 'amolscafe@gmail.com';
  const isOwner = order && (order.userId === currentUser.uid || !order.userId);

  if (order && !isAdmin && !isOwner) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500">
          <Lock size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-[#B5B5B5] max-w-sm mb-6">
          You don&apos;t have permission to view this order. It belongs to another customer account.
        </p>
        <Link
          href="/my-orders"
          className="bg-[#161616] hover:bg-[#222] border border-[#2a2a2a] text-white px-6 py-3 rounded-xl font-bold transition-all"
        >
          Go to My Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-[#B5B5B5]">We couldn&apos;t find an order with ID #{orderId}</p>
      </div>
    );
  }

  const statuses = [
    { key: 'PENDING', label: 'Order Placed', icon: ShoppingBag },
    { key: 'ACCEPTED', label: 'Order Accepted', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
    { key: 'READY', label: 'Ready', icon: PackageCheck },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  ];

  const getStatusIndex = (status: string) => {
    if (status === 'CANCELLED') return -1;
    return statuses.findIndex(s => s.key === status);
  };

  const currentIndex = getStatusIndex(order.orderStatus);

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-12 relative">
      {/* Realtime Cross-Platform Order Alert Banner (Android & iOS) */}
      <AnimatePresence>
        {liveAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-md"
          >
            <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3.5 ${
              liveAlert.type === 'ready'
                ? 'bg-[#1a140c]/95 border-[#F58A1F] text-white shadow-[#F58A1F]/20'
                : 'bg-[#1a0c0c]/95 border-red-500 text-white shadow-red-500/20'
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${
                liveAlert.type === 'ready' ? 'bg-[#F58A1F] text-white' : 'bg-red-500 text-white'
              }`}>
                {liveAlert.type === 'ready' ? <BellRing size={20} className="animate-bounce" /> : <XCircle size={20} />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base tracking-tight">{liveAlert.title}</h4>
                  <button 
                    onClick={() => setLiveAlert(null)}
                    className="text-xs text-[#888] hover:text-white px-2 py-0.5"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#DDD] mt-0.5 leading-snug">{liveAlert.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              order.orderStatus === 'CANCELLED' ? 'bg-red-500/10 border border-red-500/30' : 'bg-[#F58A1F]/10'
            }`}
          >
            {order.orderStatus === 'CANCELLED' ? (
              <XCircle size={40} className="text-red-500" />
            ) : (
              <CheckCircle2 size={40} className="text-[#F58A1F]" />
            )}
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {order.orderStatus === 'CANCELLED' ? 'Order Cancelled' : 'Order Confirmed!'}
          </h1>
          <p className="text-xl text-[#B5B5B5]">Order #{order.orderId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sm:p-10">
            <h2 className="text-xl font-bold text-white mb-8">Live Status</h2>
            
            {order.orderStatus === 'CANCELLED' ? (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl space-y-4">
                <div className="flex items-center gap-2.5 text-red-400 font-bold text-lg">
                  <AlertTriangle size={20} className="shrink-0" />
                  <span>Order Could Not Be Accepted</span>
                </div>
                
                {order.cancellationReason && (
                  <div className="bg-[#0B0B0B] border border-red-500/20 rounded-lg p-3.5">
                    <p className="text-xs text-[#888] uppercase tracking-wider mb-1 font-semibold">Reason from Kitchen:</p>
                    <p className="text-white text-sm font-medium">{order.cancellationReason}</p>
                  </div>
                )}
                
                <p className="text-xs text-[#B5B5B5] leading-relaxed">
                  We apologize for the inconvenience. Any pending payment will not be charged. You can browse our menu and place a new order.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-[#2a2a2a] hidden sm:block"></div>
                
                <div className="space-y-8 sm:space-y-12">
                  {statuses.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="relative flex items-center gap-6">
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#161616] transition-colors duration-500 ${
                          isCompleted ? 'bg-[#F58A1F] text-white' : 'bg-[#2a2a2a] text-[#555]'
                        }`}>
                          <Icon size={20} />
                        </div>
                        
                        <div>
                          <h3 className={`text-lg font-bold transition-colors duration-500 ${
                            isCompleted ? 'text-white' : 'text-[#555]'
                          }`}>
                            {step.label}
                          </h3>
                          {isCurrent && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-[#F58A1F] mt-1"
                            >
                              {step.key === 'PENDING' && "Waiting for cafe to accept your order."}
                              {step.key === 'ACCEPTED' && "Your order has been confirmed!"}
                              {step.key === 'PREPARING' && "Your food is being prepared."}
                              {step.key === 'READY' && "Your order is ready!"}
                              {step.key === 'COMPLETED' && "Thank you for visiting Amol's Cafe."}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Payment (if READY) and Order Details */}
          <div className="flex flex-col gap-8 h-full">
            {/* Payment Section */}
            {paymentSettings?.upiId && order.orderStatus === 'READY' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sm:p-10 flex flex-col items-center justify-center text-center"
              >
                {order.paymentMethod === 'CASH' ? (
                  <>
                    <div className="w-16 h-16 bg-[#F58A1F]/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="text-[#F58A1F]" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Paying with Cash</h2>
                    <p className="text-[#B5B5B5]">Please pay ₹{order.total} at the counter.</p>
                  </>
                ) : (() => {
                  const rawUpiId = (paymentSettings.upiId || '').trim();
                  const rawUpiName = (paymentSettings.upiName || "Amol's Cafe").trim();
                  const cleanUpiName = encodeURIComponent(rawUpiName);
                  const formattedAmt = String(Number(order.total).toFixed(2));
                  // Note: Clean alphanumeric text without '#', which is a URL fragment delimiter that crashes UPI intent parsers
                  const cleanTn = encodeURIComponent(`Order ${order.orderNumber || ''}`.trim() || 'Amols Cafe');
                  
                  // Standard NPCI UPI query:
                  // CRITICAL: Do NOT include 'tr', 'mc', or 'sign' on standard VPAs - they cause PhonePe/GPay security checks to fail and exit immediately!
                  const cleanUpiQuery = `pa=${rawUpiId}&pn=${cleanUpiName}&am=${formattedAmt}&cu=INR&tn=${cleanTn}`;
                  const standardUpiUrl = `upi://pay?${cleanUpiQuery}`;

                  const handleCopyUpi = () => {
                    if (!rawUpiId) return;
                    try {
                      navigator.clipboard.writeText(rawUpiId);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 3000);
                    } catch (e) {}
                  };

                  return (
                    <>
                      <h2 className="text-xl font-bold text-white mb-1">Complete Payment</h2>
                      <p className="text-[#B5B5B5] text-sm mb-6">Scan QR or tap your UPI app to pay</p>
                      
                      {/* QR Code Container */}
                      <div className="bg-white p-4 rounded-2xl mb-5 shadow-2xl flex items-center justify-center min-h-[200px] min-w-[200px] border-4 border-white/10">
                        {paymentSettings.qrImageUrl ? (
                          <img src={paymentSettings.qrImageUrl} alt="Payment QR Code" className="w-[200px] h-[200px] object-contain" />
                        ) : (
                          <QRCodeSVG 
                            value={standardUpiUrl}
                            size={200}
                            level="H"
                          />
                        )}
                      </div>

                      {/* 1-Click Copy UPI ID Card */}
                      <div className="w-full bg-[#1F1F1F] border border-[#333] rounded-xl p-3 mb-5 text-left">
                        <div className="flex items-center justify-between text-xs text-[#888] mb-1">
                          <span>CAFE UPI ID</span>
                          <span className="text-[#10B981] font-medium">Verified Merchant</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-mono text-[#F58A1F] font-semibold truncate select-all">
                            {rawUpiId}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              copiedUpi
                                ? 'bg-[#10B981] text-white'
                                : 'bg-[#2a2a2a] hover:bg-[#383838] text-white border border-[#444]'
                            }`}
                          >
                            {copiedUpi ? (
                              <>
                                <Check size={14} /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={14} /> Copy ID
                              </>
                            )}
                          </button>
                        </div>
                        {copiedUpi && (
                          <p className="text-[11px] text-[#10B981] mt-1.5 flex items-center gap-1">
                            ✓ Copied! Open GPay, PhonePe, or Paytm and send ₹{order.total}.
                          </p>
                        )}
                      </div>

                      {/* Primary Action Button */}
                      <div className="w-full space-y-3">
                        <a 
                          href={standardUpiUrl}
                          className="block w-full bg-[#F58A1F] hover:bg-[#e07a1b] text-white py-4 rounded-xl font-bold transition-all text-base shadow-lg shadow-[#F58A1F]/25 flex items-center justify-center gap-2 transform active:scale-95"
                        >
                          <Smartphone size={18} /> Pay ₹{order.total} with UPI App
                        </a>

                        <p className="text-[11px] text-[#888] leading-tight px-1 text-center">
                          Tap to pay via any installed UPI app (GPay, PhonePe, Paytm), or tap <strong className="text-[#F58A1F]">Copy ID</strong> above.
                        </p>
                        
                        <div className="relative flex items-center py-2">
                          <div className="flex-grow border-t border-[#2a2a2a]"></div>
                          <span className="flex-shrink-0 mx-4 text-[#888] text-xs font-semibold">OR PAY OFFLINE</span>
                          <div className="flex-grow border-t border-[#2a2a2a]"></div>
                        </div>

                        <button 
                          onClick={handlePayWithCash}
                          className="w-full bg-transparent border border-[#333] hover:border-[#F58A1F] hover:text-[#F58A1F] text-[#B5B5B5] py-3.5 rounded-xl font-bold transition-colors text-sm"
                        >
                          Pay with Cash at Counter
                        </button>
                        <p className="text-xs text-[#888]">Pay at the counter when you pick up your order.</p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Order Details Section */}
            <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sm:p-10 flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2a2a] pb-4">Order Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-[#B5B5B5]">Name</p>
                  <p className="text-white font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Phone</p>
                  <p className="text-white font-medium">{order.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-[#B5B5B5]">Order Type</p>
                  <p className="text-white font-medium">{order.orderType}</p>
                </div>
                {order.tableNumber && (
                  <div>
                    <p className="text-sm text-[#B5B5B5]">Table</p>
                    <p className="text-white font-medium">{order.tableNumber}</p>
                  </div>
                )}
                {order.timeNeeded && (
                  <div>
                    <p className="text-sm text-[#B5B5B5]">Needed In</p>
                    <p className="text-[#F58A1F] font-medium flex items-center gap-1.5 mt-0.5">
                      <Clock size={14} /> {order.timeNeeded}
                    </p>
                  </div>
                )}
              </div>

              <h3 className="text-white font-bold mb-4">Items</h3>
              <ul className="space-y-4 mb-6">
                {order.items.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span className="text-[#B5B5B5]">
                      {item.quantity} x {item.itemName} {item.variant ? `(${item.variant})` : ''}
                    </span>
                    <span className="text-white font-medium">₹{item.subtotal}</span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-[#2a2a2a] pt-4 flex justify-between text-white font-bold text-xl mt-auto">
                <span>Total Paid</span>
                <span className="text-[#F58A1F]">₹{order.total}</span>
              </div>

              {order.specialInstructions && (
                <div className="mt-6 p-4 bg-[#0B0B0B] rounded-xl border border-[#2a2a2a]">
                  <p className="text-sm text-[#B5B5B5] mb-1">Special Instructions:</p>
                  <p className="text-white text-sm">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F58A1F]"></div>
      </div>
    }>
      <OrderTracker />
    </Suspense>
  );
}
