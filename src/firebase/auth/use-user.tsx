"use client";

import React, { useState, useEffect, useContext, createContext } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  auth: Auth | null;
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  auth: null,
  user: null,
  loading: true,
});

export const AuthProvider = ({ auth, children }: { auth: Auth | null; children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
