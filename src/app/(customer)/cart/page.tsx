'use client';

import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore();
  const subtotal = getCartTotal();

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
          
          {/* Cart Items */}
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
