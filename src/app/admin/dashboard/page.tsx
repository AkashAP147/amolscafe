'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { IndianRupee, ShoppingBag, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { format, isToday } from 'date-fns';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOrders(Object.values(data));
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F58A1F]"></div>
      </div>
    );
  }

  // Calculate metrics
  const todaysOrders = orders.filter(o => isToday(new Date(o.createdAt)));
  
  // Realized revenue (only completed orders)
  const todaysRevenue = todaysOrders
    .filter(o => o.orderStatus === 'COMPLETED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = todaysOrders.filter(o => o.orderStatus === 'PENDING').length;
  const preparingCount = todaysOrders.filter(o => o.orderStatus === 'PREPARING').length;
  const readyCount = todaysOrders.filter(o => o.orderStatus === 'READY').length;
  const completedCount = todaysOrders.filter(o => o.orderStatus === 'COMPLETED').length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[#B5B5B5]">Welcome back. Here's what's happening at Amol's Cafe today.</p>
        <p className="text-[#F58A1F] font-medium mt-2">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard 
          title="Today's Revenue" 
          value={`₹${todaysRevenue}`} 
          icon={IndianRupee} 
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <DashboardCard 
          title="Total Orders" 
          value={todaysOrders.length.toString()} 
          icon={ShoppingBag} 
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <DashboardCard 
          title="Pending" 
          value={pendingCount.toString()} 
          icon={Clock} 
          color="text-yellow-500"
          bg="bg-yellow-500/10"
        />
        <DashboardCard 
          title="Completed" 
          value={completedCount.toString()} 
          icon={CheckCircle2} 
          color="text-[#F58A1F]"
          bg="bg-[#F58A1F]/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            <button className="text-[#F58A1F] hover:text-white transition-colors text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#B5B5B5] border-b border-[#2a2a2a]">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {orders.sort((a,b) => b.createdAt - a.createdAt).slice(0, 5).map(order => (
                  <tr key={order.orderId} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#0B0B0B] transition-colors">
                    <td className="py-4 font-bold">#{order.orderId}</td>
                    <td className="py-4">{order.customerName}</td>
                    <td className="py-4 text-sm text-[#B5B5B5]">{order.orderType}</td>
                    <td className="py-4 font-medium">₹{order.total}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.orderStatus === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                        order.orderStatus === 'PENDING' ? 'bg-blue-500/20 text-blue-500' :
                        order.orderStatus === 'CANCELLED' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-8 text-[#B5B5B5]">No orders found.</div>
            )}
          </div>
        </div>

        {/* Kitchen Status Snapshot */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Kitchen Status</h2>
          
          <div className="space-y-6">
            <StatusRow label="Pending Acceptance" count={pendingCount} color="bg-blue-500" />
            <StatusRow label="In Preparation" count={preparingCount} color="bg-[#F58A1F]" />
            <StatusRow label="Ready for Pickup" count={readyCount} color="bg-green-500" />
          </div>

          <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-4 bg-[#0B0B0B] p-4 rounded-xl border border-[#2a2a2a]">
              <div className="w-12 h-12 bg-[#F58A1F]/10 rounded-full flex items-center justify-center">
                <TrendingUp size={24} className="text-[#F58A1F]" />
              </div>
              <div>
                <p className="text-[#B5B5B5] text-sm">Avg. Completion Time</p>
                <p className="text-white font-bold text-lg">12 mins</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 flex items-center gap-4 hover:border-[#444] transition-colors">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg}`}>
        <Icon size={28} className={color} />
      </div>
      <div>
        <p className="text-[#B5B5B5] text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}

function StatusRow({ label, count, color }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-[#B5B5B5] font-medium">{label}</span>
      </div>
      <span className="text-white font-bold text-xl">{count}</span>
    </div>
  );
}
