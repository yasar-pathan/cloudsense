import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useAlerts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const getAlerts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/alerts', { params: filters });
      if (res.success) {
        setAlerts(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch alerts');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch alerts';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (id) => {
    try {
      const res = await api.patch(`/alerts/${id}/acknowledge`);
      if (res.success) {
        setAlerts((prev) => prev.map((a) => (a._id === id ? res.data : a)));
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to acknowledge alert');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to acknowledge alert';
      return { success: false, error: msg };
    }
  }, []);

  const testCall = useCallback(async (phoneNumber) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/alerts/test-call', { phoneNumber });
      if (res.success) {
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Test call failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Test call failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    alerts,
    getAlerts,
    acknowledgeAlert,
    testCall,
  };
}
