'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Instant optimistic restore from local storage cache so there is NO flash of logged-out state
    try {
      const cached = localStorage.getItem('amolscafe_auth_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid) {
          setUser(parsed as User);
        }
      }
    } catch (e) {}

    // 2. Real-time Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      try {
        if (firebaseUser) {
          // Cache essential user properties locally for instant subsequent reloads
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          localStorage.setItem('amolscafe_auth_user', JSON.stringify(userData));
        } else {
          localStorage.removeItem('amolscafe_auth_user');
        }
      } catch (e) {}
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('amolscafe_auth_user');
      await firebaseSignOut(auth);
      setUser(null);
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
