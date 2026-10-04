import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useBudgets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);

  const getBudgets = useCallback(async (connectionId) => {
    if (!connectionId) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/budgets', { params: { connectionId } });
      if (res.success) {
        setBudgets(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch budgets');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch budgets';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBudgetStatus = useCallback(async (connectionId) => {
    if (!connectionId) return [];
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/budgets/status', { params: { connectionId } });
      if (res.success) {
        setBudgetStatus(res.data || []);
        return res.data || [];
      }
      throw new Error(res.message || 'Failed to fetch budget status');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch budget status';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/budgets', payload);
      if (res.success) {
        setBudgets((prev) => [res.data, ...prev]);
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to create budget');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create budget';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBudget = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/budgets/${id}`, payload);
      if (res.success) {
        setBudgets((prev) => prev.map((b) => (b._id === id ? res.data : b)));
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to update budget');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update budget';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBudget = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/budgets/${id}`);
      if (res.success) {
        setBudgets((prev) => prev.filter((b) => b._id !== id));
        setBudgetStatus((prev) => prev.filter((b) => b.budgetId !== id));
        return { success: true };
      }
      throw new Error(res.message || 'Failed to delete budget');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete budget';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    budgets,
    budgetStatus,
    getBudgets,
    getBudgetStatus,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
