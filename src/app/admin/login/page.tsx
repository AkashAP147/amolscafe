'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password. You are not authorized.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4">
      <div className="bg-[#161616] p-8 rounded-2xl border border-[#2a2a2a] w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F58A1F]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-[#F58A1F]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-[#B5B5B5] mt-2">Authorized personnel only</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors"
              placeholder="admin@amolscafe.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#B5B5B5] mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#2a2a2a] text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#F58A1F] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#F58A1F] hover:bg-[#e07a1b] disabled:bg-[#444] disabled:text-[#888] text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
