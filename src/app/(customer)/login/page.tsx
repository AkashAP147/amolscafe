'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, Coffee } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }

      if (email.toLowerCase() === 'amolscafe@gmail.com') {
        router.push('/admin/dashboard');
      } else {
        const redirect = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') || '/menu' : '/menu';
        router.push(redirect);
      }
    } catch (err: any) {
      console.error(err);
      // Clean up firebase error messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative z-10">
        
        <Link href="/" className="absolute top-8 left-8 sm:left-16 md:left-24 xl:left-32 text-[#B5B5B5] hover:text-white transition-colors flex items-center gap-2 font-bold tracking-tight text-xl">
          <span className="text-[#F58A1F]">Amol's</span> Cafe
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-[#B5B5B5]">
              {isLogin 
                ? 'Enter your details to access your orders.' 
                : 'Sign up to start ordering your favorite food.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-500 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#B5B5B5] mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#B5B5B5]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:ring-1 focus:ring-[#F58A1F] focus:border-[#F58A1F] transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#B5B5B5]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:ring-1 focus:ring-[#F58A1F] focus:border-[#F58A1F] transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B5B5B5] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#B5B5B5]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:ring-1 focus:ring-[#F58A1F] focus:border-[#F58A1F] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#F58A1F] hover:bg-[#e07a1b] text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 mt-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[#B5B5B5]">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }} 
                className="text-[#F58A1F] font-bold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#161616] items-center justify-center overflow-hidden border-l border-[#2a2a2a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F58A1F]/20 via-[#0B0B0B] to-purple-900/20"></div>
        
        {/* Abstract floating elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#F58A1F]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 max-w-md text-center">
          <div className="w-24 h-24 bg-[#0B0B0B] border border-[#2a2a2a] rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl transform -rotate-6">
            <Coffee size={40} className="text-[#F58A1F]" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Your favorite food, just a click away.</h2>
          <p className="text-[#B5B5B5] text-lg leading-relaxed">
            Join the Amol's Cafe community today. Order ahead, skip the line, and enjoy exclusive member perks.
          </p>
        </div>
      </div>
    </div>
  );
}
