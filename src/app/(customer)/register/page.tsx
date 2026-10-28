'use client';

import { Suspense } from 'react';
import { LoginForm } from '../login/page';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F58A1F]" />
      </div>
    }>
      <LoginForm initialMode="register" />
    </Suspense>
  );
}
