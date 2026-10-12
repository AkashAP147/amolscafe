'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CheckCircle2, Clock, ChefHat, PackageCheck, ShoppingBag, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

import { Suspense } from 'react';

function OrderTracker() {
  const { orderId } = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        router.push(`/login?redirect=/order/${orderId}`);
      }
    });
    return () => unsubscribe();
  }, [orderId, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const [hasNotifiedReady, setHasNotifiedReady] = useState(false);
  const [hasNotifiedCancelled, setHasNotifiedCancelled] = useState(false);

  useEffect(() => {
    if (order?.orderStatus === 'READY' && !hasNotifiedReady) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("Order Ready!", {
          body: `Your order is ready for pickup at the counter!`,
          icon: "/logo.png"
        });
        const audio = new Audio('/bell.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));
      }
      setHasNotifiedReady(true);
    }

    if (order?.orderStatus === 'CANCELLED' && !hasNotifiedCancelled) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("Order Cancelled", {
          body: order.cancellationReason || "Sorry, your order could not be accepted.",
          icon: "/logo.png"
        });
      }
      setHasNotifiedCancelled(true);
    }
  }, [order?.orderStatus, order?.cancellationReason, hasNotifiedReady, hasNotifiedCancelled]);

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
    <div className="min-h-screen bg-[#0B0B0B] py-12">
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
                              {step.key === 'READY' && "Your order is ready! 🎉"}
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
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white mb-2">Complete Payment</h2>
                    <p className="text-[#B5B5B5] mb-8">Scan to pay securely via UPI</p>
                    
                    <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl flex items-center justify-center min-h-[200px] min-w-[200px]">
                      {paymentSettings.qrImageUrl ? (
                        <img src={paymentSettings.qrImageUrl} alt="Payment QR Code" className="w-[200px] h-[200px] object-contain" />
                      ) : (
                        <QRCodeSVG 
                          value={`upi://pay?pa=${paymentSettings.upiId}&pn=${paymentSettings.upiName || 'Amols Cafe'}&am=${order.total}&cu=INR`}
                          size={200}
                          level="H"
                        />
                      )}
                    </div>

                    <div className="w-full space-y-3">
                      <a 
                        href={`upi://pay?pa=${paymentSettings.upiId}&pn=${paymentSettings.upiName || 'Amols Cafe'}&am=${order.total}&cu=INR`}
                        className="block w-full bg-[#F58A1F] hover:bg-[#e07a1b] text-white py-4 rounded-xl font-bold transition-colors"
                      >
                        Pay ₹{order.total} with UPI App
                      </a>
                      
                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-[#2a2a2a]"></div>
                        <span className="flex-shrink-0 mx-4 text-[#888] text-sm">OR</span>
                        <div className="flex-grow border-t border-[#2a2a2a]"></div>
                      </div>

                      <button 
                        onClick={handlePayWithCash}
                        className="w-full bg-transparent border-2 border-[#2a2a2a] hover:border-[#F58A1F] hover:text-[#F58A1F] text-[#B5B5B5] py-4 rounded-xl font-bold transition-colors"
                      >
                        Continue with Cash
                      </button>
                      <p className="text-xs text-[#888]">Pay at the counter when you pick up your order.</p>
                    </div>
                  </>
                )}
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
