'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { ChefHat, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const activeOrders = orders.filter(o => 
    !['COMPLETED', 'CANCELLED'].includes(o.orderStatus)
  );

  const pending = activeOrders.filter(o => o.orderStatus === 'PENDING');
  const accepted = activeOrders.filter(o => o.orderStatus === 'ACCEPTED');
  const preparing = activeOrders.filter(o => o.orderStatus === 'PREPARING');
  const ready = activeOrders.filter(o => o.orderStatus === 'READY');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F58A1F]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
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

      <div className="flex-grow flex gap-6 overflow-x-auto pb-4 snap-x">
        
        {/* NEW ORDERS */}
        <KitchenColumn 
          title="New Orders" 
          count={pending.length} 
          color="bg-blue-500"
          orders={pending}
          actionLabel="ACCEPT ORDER"
          actionColor="bg-blue-600 hover:bg-blue-500"
          onAction={(id: string) => updateOrderStatus(id, 'ACCEPTED')}
        />

        {/* ACCEPTED / QUEUE */}
        <KitchenColumn 
          title="Queue" 
          count={accepted.length} 
          color="bg-yellow-500"
          orders={accepted}
          actionLabel="START PREPARING"
          actionColor="bg-yellow-600 hover:bg-yellow-500"
          onAction={(id: string) => updateOrderStatus(id, 'PREPARING')}
        />

        {/* PREPARING */}
        <KitchenColumn 
          title="Preparing" 
          count={preparing.length} 
          color="bg-[#F58A1F]"
          orders={preparing}
          actionLabel="MARK READY"
          actionColor="bg-[#F58A1F] hover:bg-[#e07a1b]"
          onAction={(id: string) => updateOrderStatus(id, 'READY')}
        />

        {/* READY */}
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
  );
}

function KitchenColumn({ title, count, color, orders, actionLabel, actionColor, onAction }: any) {
  return (
    <div className="flex-none w-80 sm:w-96 flex flex-col h-full bg-[#161616] rounded-2xl border border-[#2a2a2a] overflow-hidden snap-center">
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

              <button
                onClick={() => onAction(order.orderId)}
                className={`w-full py-3 rounded-lg text-white font-bold transition-colors ${actionColor}`}
              >
                {actionLabel}
              </button>
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
