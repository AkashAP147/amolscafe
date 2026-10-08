'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Users, Clock, CheckCircle2, IndianRupee } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function AdminAnalyticsPage() {
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

  const stats = useMemo(() => {
    if (!orders.length) return { revenue: 0, totalOrders: 0, completedOrders: 0, itemsSold: 0 };
    
    let revenue = 0;
    let completedOrders = 0;
    let itemsSold = 0;

    orders.forEach(order => {
      if (order.orderStatus === 'COMPLETED') {
        revenue += order.total || 0;
        completedOrders++;
        
        order.items?.forEach((item: any) => {
          itemsSold += item.quantity || 1;
        });
      }
    });

    return {
      revenue,
      totalOrders: orders.length,
      completedOrders,
      itemsSold
    };
  }, [orders]);

  const topItems = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.orderStatus === 'COMPLETED' && order.items) {
        order.items.forEach((item: any) => {
          itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + (item.quantity || 1);
        });
      }
    });

    return Object.entries(itemCounts)
      .map(([name, count]) => ({ name, sales: count }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  // Calculate today's metrics
  const todaysOrdersList = orders.filter(o => isToday(new Date(o.createdAt)));
  const todaysRevenue = todaysOrdersList
    .filter(o => o.orderStatus === 'COMPLETED')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = todaysOrdersList.filter(o => o.orderStatus === 'PENDING').length;
  const completedCount = todaysOrdersList.filter(o => o.orderStatus === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-[#F58A1F]" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Revenue Analytics</h1>
        <p className="text-[#B5B5B5]">Track your cafe's performance and sales data.</p>
        <p className="text-[#F58A1F] font-medium mt-2">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Today's Performance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <IndianRupee className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-white">₹{todaysRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold text-white">{todaysOrdersList.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Pending</p>
              <h3 className="text-2xl font-bold text-white">{pendingCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F58A1F]/10 flex items-center justify-center">
              <CheckCircle2 className="text-[#F58A1F]" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Completed</p>
              <h3 className="text-2xl font-bold text-white">{completedCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">All-Time Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-white">₹{stats.revenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Completed</p>
              <h3 className="text-2xl font-bold text-white">{stats.completedOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#F58A1F]/10 flex items-center justify-center">
              <Users className="text-[#F58A1F]" size={24} />
            </div>
            <div>
              <p className="text-[#B5B5B5] text-sm font-medium">Items Sold</p>
              <h3 className="text-2xl font-bold text-white">{stats.itemsSold}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Top Selling Items</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#B5B5B5" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#B5B5B5" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161616', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#F58A1F' }}
                />
                <Bar dataKey="sales" fill="#F58A1F" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <TrendingUp size={48} className="text-[#F58A1F] mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">More Analytics Coming Soon</h3>
          <p className="text-[#B5B5B5] max-w-sm">
            We are gathering more data to show you daily revenue charts, popular times, and customer trends.
          </p>
        </div>
      </div>

    </div>
  );
}
