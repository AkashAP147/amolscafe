'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { get, set, ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { updateProfile, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, ChevronRight, Loader2, User, Save, X, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login?redirect=/my-orders');
        return;
      }
      setUserId(user.uid);
      if (user.displayName) setUserName(user.displayName);

      try {
        const userRef = ref(db, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists() && userSnapshot.val().phone) {
          setUserPhone(userSnapshot.val().phone);
        }
      } catch (err) {
        console.warn('Could not fetch user phone number (permission denied).', err);
      }

      // Fetch orders for this user
      const ordersRef = ref(db, 'orders');
      const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(user.uid));
      
      const unsubscribeData = onValue(userOrdersQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const ordersList = Object.keys(data).map(key => data[key]);
          // Sort by newest first
          ordersList.sort((a, b) => b.createdAt - a.createdAt);
          setOrders(ordersList);
        } else {
          setOrders([]);
        }
        setLoading(false);
      });

      return () => unsubscribeData();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'PREPARING': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'READY': return 'text-[#F58A1F] bg-[#F58A1F]/10 border-[#F58A1F]/20';
      case 'COMPLETED': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-[#B5B5B5] bg-[#2a2a2a] border-[#444]';
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: userName });
        await set(ref(db, `users/${userId}/phone`), userPhone);
      }
      setIsEditingProfile(false);
    } catch (e) {
      console.error("Failed to update profile", e);
    }
    setIsSavingProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">My Profile & Orders</h1>
          <p className="text-[#B5B5B5]">Manage your account details and track your past orders.</p>
        </div>

        {/* Profile Section */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 mb-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F58A1F]/10 rounded-full flex items-center justify-center">
                <User size={24} className="text-[#F58A1F]" />
              </div>
              <h2 className="text-xl font-bold text-white">Your Details</h2>
            </div>
            {!isEditingProfile ? (
              <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-[#F58A1F] hover:text-[#e07a1b] font-medium transition-colors">
                <Edit2 size={16} /> Edit
              </button>
            ) : (
              <button onClick={() => setIsEditingProfile(false)} className="text-[#B5B5B5] hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Full Name</label>
              {isEditingProfile ? (
                <input 
                  type="text" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F58A1F] transition-colors"
                  placeholder="e.g. Akash"
                />
              ) : (
                <p className="text-white font-medium text-lg bg-[#0B0B0B] px-4 py-3 rounded-xl border border-transparent">{userName || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Mobile Number</label>
              {isEditingProfile ? (
                <input 
                  type="tel" 
                  value={userPhone} 
                  onChange={e => setUserPhone(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F58A1F] transition-colors"
                  placeholder="e.g. 7411121806"
                />
              ) : (
                <p className="text-white font-medium text-lg bg-[#0B0B0B] px-4 py-3 rounded-xl border border-transparent">{userPhone || 'Not set'}</p>
              )}
            </div>
          </div>
          
          {isEditingProfile && (
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSaveProfile} 
                disabled={isSavingProfile}
                className="bg-[#F58A1F] hover:bg-[#e07a1b] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Order History</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-[#F58A1F] animate-spin mb-4" />
            <p className="text-[#B5B5B5]">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-6">
              <Package size={32} className="text-[#B5B5B5]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No orders yet</h2>
            <p className="text-[#B5B5B5] mb-8 max-w-md">You haven't placed any orders with us. Explore our menu and treat yourself!</p>
            <Link 
              href="/menu" 
              className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-8 py-3.5 rounded-xl font-bold transition-all transform hover:scale-[1.02]"
            >
              Explore Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={order.orderId}
              >
                <Link 
                  href={`/order/${order.orderId}`}
                  className="block bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 md:p-6 hover:border-[#F58A1F]/50 transition-colors group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-bold text-lg">Order #{order.orderId.slice(-6)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#B5B5B5]">
                        <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>•</span>
                        <span>{order.items?.length || 0} items</span>
                        <span>•</span>
                        <span className="font-medium text-white">₹{order.total}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[#F58A1F] text-sm font-bold md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      View Details <ChevronRight size={18} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
