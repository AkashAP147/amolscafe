'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { useCartStore } from '@/store/useCartStore';
import { Search, Plus, Minus, Filter, ShoppingBag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  popular: boolean;
  variants?: { name: string; price: number }[];
  image?: string;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    // Real-time listener for menu items using Realtime Database
    const menuRef = ref(db, 'menu_items');
    const unsubscribe = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as MenuItem[];
        
        // Group by category manually since we fetched all
        setMenuItems(items);
      } else {
        setMenuItems([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [toastItem, setToastItem] = useState<{name: string, image?: string, isLoginAlert?: boolean} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleShowToast = (item: {name: string, image?: string, isLoginAlert?: boolean}) => {
    setToastItem(item);
    setTimeout(() => {
      setToastItem(null);
    }, item.isLoginAlert ? 4000 : 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">Our Menu</h1>
            <p className="text-[#B5B5B5]">Freshly prepared just for you.</p>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search for food, drinks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-full py-3 px-12 focus:outline-none focus:border-[#F58A1F] transition-colors"
            />
            <Search className="absolute left-4 top-3.5 text-[#B5B5B5]" size={20} />
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-3 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category 
                  ? 'bg-[#F58A1F] text-white shadow-[0_0_15px_rgba(245,138,31,0.3)]' 
                  : 'bg-[#161616] text-[#B5B5B5] hover:text-white border border-[#2a2a2a] hover:border-[#444]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-[#161616] rounded-2xl p-6 h-64 animate-pulse border border-[#2a2a2a]">
                <div className="w-1/3 h-6 bg-[#2a2a2a] rounded mb-4"></div>
                <div className="w-2/3 h-4 bg-[#2a2a2a] rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-[#2a2a2a] rounded mb-8"></div>
                <div className="w-full flex justify-between">
                  <div className="w-1/4 h-8 bg-[#2a2a2a] rounded"></div>
                  <div className="w-1/3 h-10 bg-[#2a2a2a] rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} addItem={addItem} showToast={handleShowToast} onPreview={setPreviewImage} user={user} router={router} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20 text-[#B5B5B5]">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No items found matching your search.</p>
          </div>
        )}
      </div>

      {/* Full-Screen Image Preview (Lightbox) */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
            />
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastItem && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-50 bg-[#161616] border border-[#2a2a2a] shadow-2xl rounded-2xl p-3 flex items-center gap-4 min-w-[300px]"
          >
            {toastItem.isLoginAlert ? (
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="text-red-500" />
              </div>
            ) : toastItem.image ? (
              <img src={toastItem.image} alt={toastItem.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="text-[#B5B5B5]" />
              </div>
            )}
            <div>
              <p className={`font-bold text-sm ${toastItem.isLoginAlert ? 'text-red-500' : 'text-white'}`}>
                {toastItem.isLoginAlert ? 'Login Required' : 'Added to Cart!'}
              </p>
              <p className="text-[#B5B5B5] text-xs">{toastItem.name}</p>
            </div>
            {toastItem.isLoginAlert ? (
              <Link href="/login" className="ml-auto bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors font-bold text-sm">
                Login
              </Link>
            ) : (
              <Link href="/cart" className="ml-auto bg-[#F58A1F] text-white p-2 rounded-xl hover:bg-[#e07a1b] transition-colors flex items-center justify-center shrink-0">
                <ChevronRight size={20} />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({ item, addItem, showToast, onPreview, user, router }: { item: MenuItem, addItem: any, showToast: any, onPreview: any, user: any, router: any }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(item.variants ? item.variants[0] : null);

  const currentPrice = selectedVariant ? selectedVariant.price : item.price;
  
  const handleAddToCart = () => {
    if (!item.available) return;
    
    if (!user) {
      showToast({
        name: "Please sign in to place an order.",
        isLoginAlert: true
      });
      return;
    }
    
    addItem({
      id: selectedVariant ? `${item.id}-${selectedVariant.name}` : item.id,
      productId: item.id,
      name: item.name,
      price: currentPrice,
      quantity,
      variant: selectedVariant?.name,
      image: item.image
    });
    
    showToast({
      name: item.name,
      image: item.image
    });

    // Reset quantity after adding
    setQuantity(1);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#444] transition-colors flex flex-col h-full group"
    >
      {item.image && (
        <div 
          className="relative w-full h-48 overflow-hidden cursor-pointer" 
          onClick={() => onPreview(item.image)}
        >
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent opacity-80"></div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <span className="bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
              Tap to View
            </span>
          </div>
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white">{item.name}</h3>
          {item.popular && (
            <span className="bg-[#F58A1F]/20 text-[#F58A1F] text-xs font-bold px-2 py-1 rounded-md">
              POPULAR
            </span>
          )}
        </div>
        <p className="text-[#B5B5B5] text-sm mb-4 flex-grow">{item.description}</p>
        
        {/* Variants */}
        {item.variants && item.variants.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-[#B5B5B5] mb-2 uppercase tracking-wider font-semibold">Select Option</p>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedVariant?.name === v.name 
                      ? 'bg-[#F58A1F] text-white' 
                      : 'bg-[#2a2a2a] text-[#B5B5B5] hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#2a2a2a]">
          <span className="text-2xl font-bold text-white">₹{currentPrice}</span>
          
          {item.available ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#0B0B0B] rounded-full border border-[#2a2a2a]">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#B5B5B5] hover:text-white transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center text-white font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#B5B5B5] hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white p-3 rounded-full transition-all transform hover:scale-105 active:scale-95"
                title="Add to Cart"
              >
                <ShoppingBag size={20} />
              </button>
            </div>
          ) : (
            <span className="text-red-500 font-medium text-sm bg-red-500/10 px-3 py-1.5 rounded-full">
              Currently Unavailable
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
