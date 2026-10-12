'use client';

import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  popular?: boolean;
  image?: string;
}

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const subtotal = getCartTotal();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Instant Cache Load
    try {
      const cached = localStorage.getItem('amolscafe_menu_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuItems(parsed);
        }
      }
    } catch (e) {}

    // 2. Fetch fresh menu items
    const menuRef = ref(db, 'menu_items');
    const unsubscribe = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as MenuItem[];
        setMenuItems(list);
      }
    });

    return () => unsubscribe();
  }, []);

  // Compute smart recommendations based on current cart items
  const { recommendedPairings, recommendationReason } = useMemo(() => {
    if (items.length === 0 || menuItems.length === 0) {
      return { recommendedPairings: [], recommendationReason: '' };
    }

    const cartItemIds = new Set(items.map(i => i.productId || i.id));
    const cartItemNames = new Set(items.map(i => i.name.toLowerCase()));

    // Categorize what customer already has in cart
    const hasBeverage = items.some(i => {
      const name = i.name.toLowerCase();
      const found = menuItems.find(m => m.id === i.productId || m.name === i.name);
      const cat = found?.category.toLowerCase() || '';
      return cat.includes('coffee') || cat.includes('tea') || cat.includes('beverage') || 
             cat.includes('drink') || cat.includes('shake') || cat.includes('cooler') ||
             name.includes('coffee') || name.includes('tea') || name.includes('shake') || name.includes('frappe');
    });

    const hasFood = items.some(i => {
      const name = i.name.toLowerCase();
      const found = menuItems.find(m => m.id === i.productId || m.name === i.name);
      const cat = found?.category.toLowerCase() || '';
      return cat.includes('snack') || cat.includes('burger') || cat.includes('sandwich') || 
             cat.includes('pizza') || cat.includes('fries') || cat.includes('pasta') || cat.includes('maggi') ||
             name.includes('burger') || name.includes('sandwich') || name.includes('fries') || name.includes('pizza');
    });

    // Candidates not already in cart
    const candidates = menuItems.filter(m => m.available && !cartItemIds.has(m.id) && !cartItemNames.has(m.name.toLowerCase()));

    let reason = 'Handpicked pairings for your order';
    let filtered: MenuItem[] = [];

    if (hasBeverage && !hasFood) {
      // Has drink, recommend snacks/food to go with it
      reason = 'Perfect snacks to pair with your drinks';
      filtered = candidates.filter(m => {
        const cat = m.category.toLowerCase();
        const name = m.name.toLowerCase();
        return cat.includes('snack') || cat.includes('burger') || cat.includes('sandwich') || 
               cat.includes('fries') || cat.includes('pizza') || name.includes('fries') || name.includes('sandwich');
      });
    } else if (hasFood && !hasBeverage) {
      // Has food, recommend refreshing beverages
      reason = 'Complete your meal with a refreshing beverage';
      filtered = candidates.filter(m => {
        const cat = m.category.toLowerCase();
        const name = m.name.toLowerCase();
        return cat.includes('coffee') || cat.includes('tea') || cat.includes('beverage') || 
               cat.includes('drink') || cat.includes('shake') || cat.includes('cooler') ||
               name.includes('coffee') || name.includes('tea') || name.includes('shake');
      });
    } else {
      // Has both or general items: recommend complementary or popular items
      reason = 'Frequently added together with your items';
      const currentCategories = new Set(
        items.map(i => {
          const found = menuItems.find(m => m.id === i.productId || m.name === i.name);
          return found?.category || '';
        }).filter(Boolean)
      );
      filtered = candidates.filter(m => m.popular || !currentCategories.has(m.category));
    }

    // Fallback to top available candidates if needed
    if (filtered.length < 4) {
      const popularFallback = candidates.filter(m => m.popular && !filtered.some(f => f.id === m.id));
      filtered = [...filtered, ...popularFallback];
    }
    if (filtered.length < 4) {
      const otherCandidates = candidates.filter(m => !filtered.some(f => f.id === m.id));
      filtered = [...filtered, ...otherCandidates];
    }

    return { 
      recommendedPairings: filtered.slice(0, 4), 
      recommendationReason: reason 
    };
  }, [items, menuItems]);

  const handleAddRecommended = (rec: MenuItem) => {
    addItem({
      id: rec.id,
      productId: rec.id,
      name: rec.name,
      price: rec.price,
      quantity: 1,
      image: rec.image
    });
    setAddedId(rec.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#0B0B0B] text-[#B5B5B5] px-4">
        <ShoppingBag size={64} className="mb-6 text-[#2a2a2a]" />
        <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="mb-8 text-center max-w-md">Looks like you haven't added anything to your cart yet. Explore our menu to find your favorites!</p>
        <Link 
          href="/menu"
          className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105"
        >
          BROWSE MENU
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items & Recommendations */}
          <div className="flex-grow">
            <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] overflow-hidden">
              <div className="p-6 border-b border-[#2a2a2a] flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Items ({items.length})</h2>
                <button 
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
              
              <ul className="divide-y divide-[#2a2a2a]">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.li 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex-grow flex items-center gap-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-[#2a2a2a]" />
                        ) : (
                          <div className="w-16 h-16 bg-[#2a2a2a] rounded-xl flex items-center justify-center">
                            <ShoppingBag size={24} className="text-[#B5B5B5]" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {item.name}
                            {item.variant && (
                              <span className="text-xs bg-[#2a2a2a] text-[#B5B5B5] px-2 py-0.5 rounded-md">
                                {item.variant}
                              </span>
                            )}
                          </h3>
                          <p className="text-[#F58A1F] font-semibold mt-1">₹{item.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center bg-[#0B0B0B] rounded-full border border-[#2a2a2a]">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-[#B5B5B5] hover:text-white transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-[#B5B5B5] hover:text-white transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-white w-20 text-right">
                            ₹{item.price * item.quantity}
                          </span>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-[#B5B5B5] hover:text-red-500 transition-colors p-2"
                            title="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            {/* Smart Recommendations Section */}
            {recommendedPairings.length > 0 && (
              <div className="mt-8 bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#F58A1F]/15 rounded-xl text-[#F58A1F]">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Recommended Pairings
                      </h3>
                      <p className="text-xs text-[#888]">{recommendationReason}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendedPairings.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-[#0B0B0B] border border-[#2a2a2a] hover:border-[#F58A1F]/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {rec.image ? (
                          <img src={rec.image} alt={rec.name} className="w-14 h-14 rounded-lg object-cover border border-[#222] shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#1a1a1a] border border-[#222] flex items-center justify-center shrink-0 text-[#888]">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{rec.name}</h4>
                          <p className="text-xs text-[#888] truncate">{rec.category}</p>
                          <span className="text-sm font-bold text-[#F58A1F]">₹{rec.price}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddRecommended(rec)}
                        className={`shrink-0 text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-md ${
                          addedId === rec.id
                            ? 'bg-green-600 text-white'
                            : 'bg-[#F58A1F] hover:bg-[#e07a1b] text-white shadow-[#F58A1F]/20'
                        }`}
                      >
                        {addedId === rec.id ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a] p-6 sticky top-28">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[#B5B5B5]">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#B5B5B5]">
                  <span>Tax</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between text-[#B5B5B5]">
                  <span>Discount</span>
                  <span>₹0</span>
                </div>
                <div className="border-t border-[#2a2a2a] pt-4 flex justify-between text-white font-bold text-xl">
                  <span>Total</span>
                  <span className="text-[#F58A1F]">₹{subtotal}</span>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.preventDefault();
                  import('@/lib/firebase').then(({ auth }) => {
                    if (auth.currentUser) {
                      window.location.href = '/checkout';
                    } else {
                      window.location.href = '/login?redirect=/checkout';
                    }
                  });
                }}
                className="w-full bg-[#F58A1F] hover:bg-[#e07a1b] text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                PROCEED TO CHECKOUT <ArrowRight size={20} />
              </button>
              
              <Link 
                href="/menu"
                className="block text-center mt-4 text-[#B5B5B5] hover:text-white text-sm transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
