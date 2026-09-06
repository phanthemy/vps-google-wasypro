import { useState, useEffect, useCallback } from 'react';

export interface UserSession {
  id: string;
  role: 'admin' | 'accountant' | 'marketing' | 'ctv' | 'customer';
  fullName: string;
  tier?: string;
  phone: string;
  mustChangePassword?: boolean;
  // Participant / CTV system fields
  isSystemParticipant?: boolean;
  participantAt?: string | null;
  qualifyingPoints?: number;
  sPoints?: number;
  businessId?: string | null;
  rank?: string | null;
  rankStatus?: string | null;
}

export function useUnifiedAuth() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('crm_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem('crm_user', JSON.stringify(data.data));
          return data.data;
        }
      } else if (res.status === 401) {
        setUser(null);
        localStorage.removeItem('crm_user');
      }
    } catch (e) {
      console.warn('Session check failed', e);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (phone: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }
    setUser(data.data);
    localStorage.setItem('crm_user', JSON.stringify(data.data));
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('Logout request failed', e);
    } finally {
      setUser(null);
      localStorage.removeItem('crm_user');
    }
  };

  return {
    user,
    setUser,
    isLoading,
    login,
    logout,
    checkSession,
    isLoggedIn: !!user,
    isCtv: user?.role === 'ctv' || user?.role === 'admin' || user?.role === 'accountant',
    isAdmin: user?.role === 'admin',
    isAccountant: user?.role === 'accountant',
  };
}
