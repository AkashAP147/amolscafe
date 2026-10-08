'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Loader2, Search, Clock, CheckCircle, ChefHat } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest first
        orderList.sort((a, b) => (b.createdAt || b.timestamp || Date.now()) - (a.createdAt || a.timestamp || Date.now()));
        setOrders(orderList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await update(ref(db, `orders/${orderId}`), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500';
      case 'PREPARING': return 'bg-blue-500/20 text-blue-500';
      case 'READY': return 'bg-green-500/20 text-green-500';
      case 'COMPLETED': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const filteredOrders = orders.filter(order => {
    const currentStatus = order.orderStatus || order.status || 'Pending';
    const matchesFilter = filter === 'All' || currentStatus === filter;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-[#F58A1F]" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Order History</h1>
          <p className="text-[#B5B5B5]">View and manage all customer orders.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B5B5B5]" size={18} />
            <input 
              type="text" 
              placeholder="Search order ID or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-[#161616] border border-[#2a2a2a] text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#F58A1F]"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#161616] border border-[#2a2a2a] text-white rounded-xl py-2.5 px-4 focus:outline-none focus:border-[#F58A1F]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden flex-grow overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#0B0B0B] sticky top-0 z-10">
            <tr className="text-[#B5B5B5] border-b border-[#2a2a2a]">
              <th className="py-4 px-6 font-medium">Order ID / Time</th>
              <th className="py-4 px-6 font-medium">Customer</th>
              <th className="py-4 px-6 font-medium">Items</th>
              <th className="py-4 px-6 font-medium">Total</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-white divide-y divide-[#2a2a2a]">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                <td className="py-4 px-6">
                  <div className="font-mono text-[#F58A1F] font-bold">#{order.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm text-[#B5B5B5] mt-1">
                    {new Date(order.createdAt || order.timestamp || Date.now()).toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-bold">{order.customerName || 'Walk-in Customer'}</div>
                  <div className="text-sm text-[#B5B5B5]">{order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-sm max-w-[200px]">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="truncate">
                        {item.quantity}x {item.itemName || item.name} {item.variant ? `(${item.variant.name || item.variant})` : ''}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6 font-bold">₹{order.total}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.orderStatus || order.status)}`}>
                    {order.orderStatus || order.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                        className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                        title="Start Preparing"
                      >
                        <ChefHat size={16} /> Prep
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Ready')}
                        className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                        title="Mark Ready"
                      >
                        <CheckCircle size={16} /> Ready
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Completed')}
                        className="p-2 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                        title="Complete Order"
                      >
                        <CheckCircle size={16} /> Finish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 text-[#B5B5B5]">
            <p>No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
