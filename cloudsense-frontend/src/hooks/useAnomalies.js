import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useAnomalies() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  const getAnomalies = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/anomalies', { params: filters });
      if (res.success) {
        setAnomalies(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch anomalies');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch anomalies';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnomalyById = useCallback(async (id) => {
    try {
      const res = await api.get(`/anomalies/${id}`);
      if (res.success) {
        return res.data;
      }
      throw new Error(res.message || 'Failed to fetch anomaly detail');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch anomaly detail';
      throw new Error(msg);
    }
  }, []);

  const runScan = useCallback(async (connectionId) => {
    if (!connectionId) return null;
    setScanning(true);
    setError(null);
    try {
      const res = await api.post('/anomalies/scan', { connectionId });
      if (res.success) {
        const detected = res.data?.anomalies || [];
        setAnomalies(detected);
        return { success: true, count: res.data?.detected || 0, anomalies: detected };
      }
      throw new Error(res.message || 'Anomaly scan failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Anomaly scan failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setScanning(false);
    }
  }, []);

  const updateAnomalyStatus = useCallback(async (id, status) => {
    try {
      const res = await api.patch(`/anomalies/${id}/status`, { status });
      if (res.success) {
        setAnomalies((prev) => prev.map((a) => (a._id === id ? res.data : a)));
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to update anomaly status');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update anomaly status';
      return { success: false, error: msg };
    }
  }, []);

  return {
    loading,
    scanning,
    error,
    anomalies,
    getAnomalies,
    getAnomalyById,
    runScan,
    updateAnomalyStatus,
  };
}
