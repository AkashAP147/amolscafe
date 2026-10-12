'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 rounded-full bg-[#F58A1F]/10 border border-[#F58A1F]/20 flex items-center justify-center mb-6 text-[#F58A1F]">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">Something went wrong</h1>
      <p className="text-[#B5B5B5] max-w-md mb-8 text-sm">
        We encountered a temporary problem loading this page. Please try refreshing or go back to home.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <RotateCcw size={18} /> Try Again
        </button>
        <Link
          href="/"
          className="bg-[#161616] hover:bg-[#222] border border-[#2a2a2a] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <Home size={18} /> Home
        </Link>
      </div>
    </div>
  );
}
