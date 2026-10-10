import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { getToken, isTokenValid } from '../lib/auth';

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, token, setUser, setToken, clearAuth } = useAppStore();

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        // Also set cookie for middleware
        document.cookie = `cs_token=${res.data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/dashboard');
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        document.cookie = `cs_token=${res.data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push('/connect');
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        document.cookie = `cs_token=${res.data.token}; path=/; max-age=604800; SameSite=Lax`;
        router.push(res.data.isNewUser ? '/connect' : '/dashboard');
        return { success: true };
      }
      throw new Error(res.message || 'Google sign-in failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google sign-in failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuth();
    document.cookie = 'cs_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  }, [clearAuth, router]);

  const getMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.error('Failed to get current user:', err);
    }
    return null;
  }, [setUser]);

  const isAuthenticated = useCallback(() => {
    const currentToken = token || getToken();
    return Boolean(currentToken && isTokenValid(currentToken));
  }, [token]);

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    googleLogin,
    logout,
    getMe,
    isAuthenticated,
  };
}
