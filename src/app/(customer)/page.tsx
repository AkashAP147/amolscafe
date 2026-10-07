'use client';

import Link from 'next/link';
import { ArrowRight, Coffee, Utensils, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function Home() {
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    const heroRef = ref(db, 'settings/heroImage');
    const unsubscribe = onValue(heroRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setHeroImage(data);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/40 to-[#0B0B0B] z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: heroImage ? `url(${heroImage})` : `url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop')` }}
        />
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            Welcome to <span className="text-[#F58A1F]">Amol's</span> Cafe
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-[#F5E9D0] mb-10 font-medium"
          >
            Good Food. Great Coffee. Better Moments.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button 
              onClick={(e) => {
                e.preventDefault();
                import('@/lib/firebase').then(({ auth }) => {
                  if (auth.currentUser) {
                    window.location.href = '/menu';
                  } else {
                    window.location.href = '/login?redirect=/menu';
                  }
                });
              }}
              className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              ORDER NOW <ArrowRight size={20} />
            </button>
            <Link 
              href="/menu" 
              className="bg-[#161616]/80 backdrop-blur-sm border border-[#2a2a2a] hover:bg-[#2a2a2a] text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
            >
              EXPLORE MENU
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0B0B0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#161616] p-8 rounded-2xl border border-[#2a2a2a] text-center transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-[#F58A1F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee size={32} className="text-[#F58A1F]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Premium Coffee</h3>
              <p className="text-[#B5B5B5]">Expertly brewed coffee using carefully selected premium beans for the perfect cup.</p>
            </div>
            
            <div className="bg-[#161616] p-8 rounded-2xl border border-[#2a2a2a] text-center transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-[#F58A1F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Utensils size={32} className="text-[#F58A1F]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fresh Food</h3>
              <p className="text-[#B5B5B5]">From artisan pizzas to loaded burgers, everything is prepared fresh when you order.</p>
            </div>
            
            <div className="bg-[#161616] p-8 rounded-2xl border border-[#2a2a2a] text-center transform hover:-translate-y-2 transition-transform duration-300">
              <div className="bg-[#F58A1F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={32} className="text-[#F58A1F]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fast Service</h3>
              <p className="text-[#B5B5B5]">Quick preparation with real-time order tracking. Your time is valuable to us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Banner */}
      <section className="py-20 bg-[#161616] border-y border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Craving Something?</h2>
          <p className="text-[#B5B5B5] mb-10 max-w-2xl mx-auto">
            Explore our wide variety of fast food and beverages.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Pizza', 'Burger', 'Sandwich', 'Maggie', 'Momos', 'Drinks'].map((category) => (
              <Link 
                key={category} 
                href="/menu"
                className="px-6 py-3 bg-[#0B0B0B] border border-[#2a2a2a] rounded-full text-white hover:border-[#F58A1F] hover:text-[#F58A1F] transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
