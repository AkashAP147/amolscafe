'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { get } from 'firebase/database';
import { ArrowLeft, CheckCircle2, Loader2, Utensils, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.displayName) setName(user.displayName);
        
        try {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists() && snapshot.val().phone) {
            setMobile(snapshot.val().phone);
          }
        } catch (error) {
          console.warn('Could not fetch user phone number (permission denied or missing).', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const subtotal = getCartTotal();

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0B0B0B] text-[#B5B5B5] px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
        <Link href="/menu" className="text-[#F58A1F] hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Menu
        </Link>
      </div>
    );
  }

  const generateOrderId = () => {
    const prefix = 'AC';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your name');
    if (!mobile.trim() || mobile.length < 10) return setError('Please enter a valid mobile number');
    if (orderType === 'Dine In' && !tableNumber.trim()) return setError('Please enter your table number');

    setIsSubmitting(true);

    try {
      const orderId = generateOrderId();
      
      let currentUserId = null;
      try {
        const { auth } = await import('@/lib/firebase');
        if (auth.currentUser) {
          currentUserId = auth.currentUser.uid;
        }
      } catch (e) {}

      const orderData = {
        orderId,
        userId: currentUserId,
        customerName: name.trim(),
        phone: mobile.trim(),
        orderType,
        tableNumber: orderType === 'Dine In' ? tableNumber.trim() : null,
        specialInstructions: specialInstructions.trim(),
        items: items.map(item => ({
          itemId: item.productId,
          itemName: item.name,
          variant: item.variant || null,
          priceAtOrder: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        paymentStatus: 'Pending',
        orderStatus: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Write to Firebase Realtime Database
      await set(ref(db, `orders/${orderId}`), orderData);

      // Save phone number and name to user profile
      if (currentUserId) {
        try {
          const { auth } = await import('@/lib/firebase');
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name.trim() });
            await set(ref(db, `users/${currentUserId}/phone`), mobile.trim());
          }
        } catch (e) {
          console.error('Failed to update user profile', e);
        }
      }

      // Clear cart
      clearCart();

      // Redirect to tracking page
      router.push(`/order/${orderId}`);
      
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError('Unable to place your order. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart" className="text-[#B5B5B5] hover:text-white transition-colors bg-[#161616] p-2 rounded-full border border-[#2a2a2a]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Checkout Form */}
          <div className="flex-grow">
            <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-[#2a2a2a] pb-4">Customer Details</h2>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Full Name *</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Akash"
                      className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Mobile Number *</label>
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 7411121806"
                      className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-[#2a2a2a] pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Order Type</h3>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderType('Dine In')}
                      className={`flex-1 py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        orderType === 'Dine In' 
                          ? 'border-[#F58A1F] bg-[#F58A1F]/10 text-[#F58A1F]' 
                          : 'border-[#2a2a2a] bg-[#0B0B0B] text-[#B5B5B5] hover:border-[#444]'
                      }`}
                    >
                      <Utensils size={24} />
                      <span className="font-bold">Dine In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('Take Away')}
                      className={`flex-1 py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        orderType === 'Take Away' 
                          ? 'border-[#F58A1F] bg-[#F58A1F]/10 text-[#F58A1F]' 
                          : 'border-[#2a2a2a] bg-[#0B0B0B] text-[#B5B5B5] hover:border-[#444]'
                      }`}
                    >
                      <ShoppingBag size={24} />
                      <span className="font-bold">Take Away</span>
                    </button>
                  </div>
                </div>

                {orderType === 'Dine In' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4"
                  >
                    <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Table Number *</label>
                    <input 
                      type="text" 
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full sm:w-1/2 bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors"
                      required={orderType === 'Dine In'}
                    />
                  </motion.div>
                )}

                <div className="border-t border-[#2a2a2a] pt-6">
                  <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Special Instructions (Optional)</label>
                  <textarea 
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, extra cheese..."
                    rows={3}
                    className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors resize-none"
                  />
                </div>
                
              </form>
            </div>
          </div>

          {/* Order Summary & Submit */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sticky top-28">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              <ul className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#2a2a2a]" />
                      ) : (
                        <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg shrink-0" />
                      )}
                      <span className="text-[#B5B5B5] truncate">
                        {item.quantity} x {item.name} {item.variant ? `(${item.variant})` : ''}
                      </span>
                    </div>
                    <span className="text-white font-medium shrink-0">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-4 mb-6 border-t border-[#2a2a2a] pt-6">
                <div className="flex justify-between text-white font-bold text-2xl">
                  <span>Total</span>
                  <span className="text-[#F58A1F]">₹{subtotal}</span>
                </div>
              </div>

              <p className="text-xs text-[#B5B5B5] mb-6 text-center">
                Payment will be collected at the cafe via Cash or UPI.
              </p>

              <button 
                form="checkout-form"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F58A1F] hover:bg-[#e07a1b] disabled:bg-[#444] disabled:text-[#888] disabled:transform-none text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,138,31,0.2)] disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> PLACING ORDER...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} /> PLACE ORDER
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
