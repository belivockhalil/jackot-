'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  useEffect(() => {
    // Check localStorage on every page load
    try {
      const savedUser  = localStorage.getItem('jackot_user');
      const savedToken = localStorage.getItem('jackot_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Auth restore failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { userId, accessToken } = res.data;

    localStorage.setItem('jackot_token', accessToken);
    localStorage.setItem('jackot_user',  JSON.stringify({ userId, email }));

    setUser({ userId, email });
    router.push('/dashboard');
  };

  const signup = async (email, password, businessName, greetingName) => {
    await api.post('/auth/signup', { email, password, businessName, greetingName });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('jackot_token');
    localStorage.removeItem('jackot_user');
    setUser(null);
    router.push('/login');
  };

  // Don't render anything until we know if user is logged in
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);