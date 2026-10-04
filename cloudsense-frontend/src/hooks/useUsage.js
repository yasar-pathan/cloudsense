import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useUsage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUsage, setCurrentUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [services, setServices] = useState([]);

  const getCurrentUsage = useCallback(async (connectionId) => {
    if (!connectionId) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/usage/current', { params: { connectionId } });
      if (res.success) {
        setCurrentUsage(res.data);
        return res.data;
      }
      throw new Error(res.message || 'Failed to fetch current usage');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch current usage';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsageHistory = useCallback(async (connectionId, days = 30) => {
    if (!connectionId) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/usage/history', { params: { connectionId, days } });
      if (res.success) {
        setHistory(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch usage history');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch usage history';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceBreakdown = useCallback(async (connectionId) => {
    if (!connectionId) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/usage/services', { params: { connectionId } });
      if (res.success) {
        setServices(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch service breakdown');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch service breakdown';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const syncUsage = useCallback(async (connectionId) => {
    if (!connectionId) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/usage/sync', { connectionId });
      if (res.success) {
        setCurrentUsage(res.data?.snapshot);
        return res.data?.snapshot;
      }
      throw new Error(res.message || 'Failed to sync usage');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sync usage';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    currentUsage,
    history,
    services,
    getCurrentUsage,
    getUsageHistory,
    getServiceBreakdown,
    syncUsage,
  };
}
