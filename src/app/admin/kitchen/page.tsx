'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { ChefHat, CheckCircle2, Clock, PackageCheck, AlertCircle, XCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const PREDEFINED_REJECTION_REASONS = [
  'Item out of stock / Ingredients unavailable',
  'Kitchen is currently overloaded',
  'Requested items unavailable right now',
  'Closing time / Kitchen closed',
  'Unable to fulfill special customization request'
];

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY'>('PENDING');
  const previousPendingCount = useRef(0);

  // Reject modal state
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  useEffect(() => {
    // Request notification permission safely (Safari iOS might throw without user gesture)
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().catch(e => console.warn('Notification permission error:', e));
      }
    } catch (err) {
      console.warn("Notification API not fully supported", err);
    }
    // Listen to all orders for the kitchen screen
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          ...data[key]
        }));
        // Sort by oldest first
        orderList.sort((a, b) => a.createdAt - b.createdAt);
        setOrders(orderList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updates: any = {};
      updates[`orders/${orderId}/orderStatus`] = newStatus;
      updates[`orders/${orderId}/updatedAt`] = Date.now();
      await update(ref(db), updates);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleOpenRejectModal = (order: any) => {
    setRejectingOrder(order);
    setSelectedReason(PREDEFINED_REJECTION_REASONS[0]);
    setCustomReason('');
    setIsCustomReason(false);
  };

  const handleCloseRejectModal = () => {
    setRejectingOrder(null);
    setCustomReason('');
    setIsCustomReason(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setIsSubmittingReject(true);

    const finalReason = isCustomReason 
      ? (customReason.trim() || 'Sorry, we are unable to process this order at this time.')
      : selectedReason;

    try {
      const updates: any = {};
      updates[`orders/${rejectingOrder.orderId}/orderStatus`] = 'CANCELLED';
      updates[`orders/${rejectingOrder.orderId}/cancellationReason`] = finalReason;
      updates[`orders/${rejectingOrder.orderId}/cancelledBy`] = 'Kitchen';
      updates[`orders/${rejectingOrder.orderId}/cancelledAt`] = Date.now();
      updates[`orders/${rejectingOrder.orderId}/updatedAt`] = Date.now();

      await update(ref(db), updates);

      // Optionally offer WhatsApp notification to customer if phone number exists
      const phone = rejectingOrder.phone ? rejectingOrder.phone.replace(/\D/g, '') : '';
      if (phone) {
        const customerNumber = phone.length === 10 ? `91${phone}` : phone;
        const msg = `*Update on Order #${rejectingOrder.orderId} - Amol's Cafe*\n\nDear ${rejectingOrder.customerName || 'Customer'},\nWe regret to inform you that your order could not be accepted.\n\n*Reason:* ${finalReason}\n\nWe apologize for the inconvenience and hope to serve you again soon!`;
        const waUrl = `https://wa.me/${customerNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      handleCloseRejectModal();
    } catch (err) {
      console.error('Failed to reject order:', err);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const activeOrders = orders.filter(o => 
    !['COMPLETED', 'CANCELLED'].includes(o.orderStatus)
  );

  const pending = activeOrders.filter(o => o.orderStatus === 'PENDING');
  const accepted = activeOrders.filter(o => o.orderStatus === 'ACCEPTED');
  const preparing = activeOrders.filter(o => o.orderStatus === 'PREPARING');
  const ready = activeOrders.filter(o => o.orderStatus === 'READY');

  useEffect(() => {
    if (pending.length > previousPendingCount.current) {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function' && Notification.permission === 'granted') {
          new Notification("New Order Received!", {
            body: `You have ${pending.length - previousPendingCount.current} new order(s) waiting to be accepted.`,
            icon: "/logo.png"
          });
        }
      } catch (err) {
        console.warn("Could not show notification", err);
      }

      try {
        // Play a simple beep sound safely
        const audio = new Audio('/bell.mp3'); 
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (err) {}
    }
    previousPendingCount.current = pending.length;
  }, [pending.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F58A1F]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ChefHat className="text-[#F58A1F]" size={32} />
            Kitchen Display
          </h1>
          <p className="text-[#B5B5B5] mt-1">Live order management system</p>
        </div>
        <div className="bg-[#161616] border border-[#2a2a2a] px-4 py-2 rounded-xl flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">System Online</span>
        </div>
      </div>

      <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('PENDING')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-[#161616] text-[#B5B5B5] border border-[#2a2a2a]'}`}>New ({pending.length})</button>
        <button onClick={() => setActiveTab('ACCEPTED')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'ACCEPTED' ? 'bg-yellow-500 text-white' : 'bg-[#161616] text-[#B5B5B5] border border-[#2a2a2a]'}`}>Queue ({accepted.length})</button>
        <button onClick={() => setActiveTab('PREPARING')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'PREPARING' ? 'bg-[#F58A1F] text-white' : 'bg-[#161616] text-[#B5B5B5] border border-[#2a2a2a]'}`}>Prep ({preparing.length})</button>
        <button onClick={() => setActiveTab('READY')} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'READY' ? 'bg-green-500 text-white' : 'bg-[#161616] text-[#B5B5B5] border border-[#2a2a2a]'}`}>Ready ({ready.length})</button>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden md:overflow-x-auto pb-4">
        
        {/* NEW ORDERS */}
        <div className={`flex-none w-full md:w-80 lg:w-96 h-full ${activeTab === 'PENDING' ? 'block' : 'hidden md:block'}`}>
          <KitchenColumn 
            title="New Orders" 
            count={pending.length} 
            color="bg-blue-500"
            orders={pending}
            actionLabel="ACCEPT ORDER"
            actionColor="bg-blue-600 hover:bg-blue-500"
            onAction={(id: string) => updateOrderStatus(id, 'ACCEPTED')}
            onReject={handleOpenRejectModal}
          />
        </div>

        {/* ACCEPTED / QUEUE */}
        <div className={`flex-none w-full md:w-80 lg:w-96 h-full ${activeTab === 'ACCEPTED' ? 'block' : 'hidden md:block'}`}>
          <KitchenColumn 
            title="Queue" 
            count={accepted.length} 
            color="bg-yellow-500"
            orders={accepted}
            actionLabel="START PREPARING"
            actionColor="bg-yellow-600 hover:bg-yellow-500"
            onAction={(id: string) => updateOrderStatus(id, 'PREPARING')}
            onReject={handleOpenRejectModal}
          />
        </div>

        {/* PREPARING */}
        <div className={`flex-none w-full md:w-80 lg:w-96 h-full ${activeTab === 'PREPARING' ? 'block' : 'hidden md:block'}`}>
          <KitchenColumn 
            title="Preparing" 
            count={preparing.length} 
            color="bg-[#F58A1F]"
            orders={preparing}
            actionLabel="MARK READY"
            actionColor="bg-[#F58A1F] hover:bg-[#e07a1b]"
            onAction={(id: string) => updateOrderStatus(id, 'READY')}
            onReject={handleOpenRejectModal}
          />
        </div>

        {/* READY */}
        <div className={`flex-none w-full md:w-80 lg:w-96 h-full ${activeTab === 'READY' ? 'block' : 'hidden md:block'}`}>
          <KitchenColumn 
            title="Ready for Pickup" 
            count={ready.length} 
            color="bg-green-500"
            orders={ready}
            actionLabel="COMPLETE ORDER"
            actionColor="bg-green-600 hover:bg-green-500"
            onAction={(id: string) => updateOrderStatus(id, 'COMPLETED')}
          />
        </div>

      </div>

      {/* REJECT ORDER MODAL */}
      <AnimatePresence>
        {rejectingOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#0B0B0B]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Reject Order #{rejectingOrder.orderId}</h3>
                    <p className="text-xs text-[#888]">Customer: {rejectingOrder.customerName || 'Guest'} • {rejectingOrder.phone || 'No phone'}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseRejectModal}
                  className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2.5">
                    Select Predefined Reason:
                  </label>
                  <div className="space-y-2">
                    {PREDEFINED_REJECTION_REASONS.map((reason) => {
                      const isSelected = !isCustomReason && selectedReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setSelectedReason(reason);
                            setIsCustomReason(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-red-500 bg-red-500/10 text-white font-medium'
                              : 'border-[#2a2a2a] bg-[#0B0B0B] text-[#B5B5B5] hover:border-[#444]'
                          }`}
                        >
                          <span>{reason}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setIsCustomReason(true)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                        isCustomReason
                          ? 'border-red-500 bg-red-500/10 text-white font-medium'
                          : 'border-[#2a2a2a] bg-[#0B0B0B] text-[#B5B5B5] hover:border-[#444]'
                      }`}
                    >
                      <span>Custom message / specific explanation</span>
                      {isCustomReason && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />}
                    </button>
                  </div>
                </div>

                {isCustomReason && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-1.5">
                      Write Custom Reason to Customer:
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="e.g. Blue Mojito syrup finished and burger patties out of stock..."
                      rows={3}
                      className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                    />
                  </motion.div>
                )}

                <div className="bg-[#0B0B0B] p-3.5 rounded-xl border border-[#2a2a2a] text-xs text-[#888] space-y-1">
                  <p className="text-[#B5B5B5] font-semibold flex items-center gap-1.5">
                    <Send size={14} className="text-[#F58A1F]" /> Customer Notification
                  </p>
                  <p>
                    The order status will update to <span className="text-red-400 font-bold">CANCELLED</span> on the customer&apos;s live tracking screen with this reason. If customer phone is present, a WhatsApp rejection notification will also be prepared.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[#2a2a2a] flex gap-3 justify-end bg-[#0B0B0B]">
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  disabled={isSubmittingReject}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#B5B5B5] hover:text-white bg-[#222] hover:bg-[#2a2a2a] transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isSubmittingReject}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {isSubmittingReject ? 'Rejecting...' : 'Reject & Notify Customer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KitchenColumn({ title, count, color, orders, actionLabel, actionColor, onAction, onReject }: any) {
  return (
    <div className="flex flex-col h-full bg-[#161616] rounded-2xl border border-[#2a2a2a] overflow-hidden">
      <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center bg-[#0B0B0B]/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          {title}
        </h2>
        <span className="bg-[#2a2a2a] text-white text-xs font-bold px-3 py-1 rounded-full">
          {count}
        </span>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {orders.map((order: any) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.orderId}
              className="bg-[#0B0B0B] border border-[#2a2a2a] rounded-xl p-4 flex flex-col relative overflow-hidden"
            >
              {/* Top border accent based on status */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${color}`}></div>
              
              <div className="flex justify-between items-start mb-3 pt-1">
                <div>
                  <h3 className="text-white font-bold text-lg">#{order.orderId}</h3>
                  <p className="text-[#B5B5B5] text-sm flex items-center gap-1">
                    <Clock size={14} /> 
                    {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    order.orderType === 'Dine In' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    {order.orderType}
                  </span>
                  {order.tableNumber && (
                    <p className="text-white font-bold mt-1">Table {order.tableNumber}</p>
                  )}
                  {order.timeNeeded && (
                    <p className="text-[#F58A1F] text-xs font-semibold flex items-center gap-1 mt-1 justify-end">
                      <Clock size={12} /> {order.timeNeeded}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[#161616] rounded-lg p-3 mb-4 flex-grow">
                <ul className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between text-white text-sm border-b border-[#2a2a2a] pb-2 last:border-0 last:pb-0">
                      <span className="font-medium">
                        <span className="text-[#F58A1F] font-bold mr-2">{item.quantity}x</span>
                        {item.itemName} {item.variant ? `(${item.variant})` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {order.specialInstructions && (
                <div className="mb-4 flex gap-2 text-yellow-500 bg-yellow-500/10 p-2 rounded-lg text-sm border border-yellow-500/20">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{order.specialInstructions}</p>
                </div>
              )}

              <div className="flex gap-2">
                {onReject && (
                  <button
                    onClick={() => onReject(order)}
                    className="px-3 py-3 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    title="Reject order"
                  >
                    <XCircle size={16} /> REJECT
                  </button>
                )}
                <button
                  onClick={() => onAction(order.orderId)}
                  className={`flex-1 py-3 rounded-lg text-white font-bold transition-colors ${actionColor}`}
                >
                  {actionLabel}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <div className="text-center py-10 text-[#555]">
            <p>No orders in this stage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
