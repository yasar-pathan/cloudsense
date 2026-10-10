'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Plus, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import BudgetCard from '../../../components/budgets/BudgetCard';
import BudgetForm from '../../../components/budgets/BudgetForm';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useAppStore } from '../../../store/useAppStore';
import { useBudgets } from '../../../hooks/useBudgets';
import { useUsage } from '../../../hooks/useUsage';

export default function BudgetsPage() {
  const { activeConnection } = useAppStore();
  const {
    budgets,
    budgetStatus,
    getBudgets,
    getBudgetStatus,
    createBudget,
    updateBudget,
    deleteBudget,
    loading: budgetLoading,
    error: budgetError,
  } = useBudgets();

  const { services, getServiceBreakdown } = useUsage();

  const [editingBudget, setEditingBudget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const loadData = async () => {
    if (!activeConnection?._id) return;
    try {
      await Promise.all([
        getBudgets(activeConnection._id),
        getBudgetStatus(activeConnection._id),
        getServiceBreakdown(activeConnection._id),
      ]);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeConnection?._id]);

  const handleFormSubmit = async (payload) => {
    if (!activeConnection?._id) return { success: false, error: 'No active connection' };
    setFormLoading(true);
    try {
      if (editingBudget) {
        const res = await updateBudget(editingBudget._id, payload);
        if (res.success) {
          setEditingBudget(null);
          setSuccessToast('Budget updated successfully');
          await getBudgetStatus(activeConnection._id);
          setTimeout(() => setSuccessToast(null), 3000);
          return { success: true };
        }
        return res;
      } else {
        const res = await createBudget({
          ...payload,
          connectionId: activeConnection._id,
        });
        if (res.success) {
          setSuccessToast('Budget created successfully');
          await getBudgetStatus(activeConnection._id);
          setTimeout(() => setSuccessToast(null), 3000);
          return { success: true };
        }
        return res;
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    await deleteBudget(id);
    setSuccessToast('Budget deleted');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  if (!activeConnection) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No AWS Account Connected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connect your AWS account via STS AssumeRole before configuring budgets.
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Connect AWS Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const hasOverallBudget = budgets.some((b) => b.type === 'overall');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets & Alert Thresholds"
        subtitle="Define cost caps and automated notification triggers across your cloud workloads"
        actions={
          editingBudget && (
            <button
              type="button"
              onClick={() => setEditingBudget(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Budget</span>
            </button>
          )
        }
      />

      {budgetError && <ErrorBanner message={budgetError} onRetry={loadData} />}

      {successToast && (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column — Budget List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Configured Budgets</h3>
            <span className="text-xs text-slate-500">{budgets.length} total</span>
          </div>

          {budgetLoading && budgets.length === 0 ? (
            <LoadingSpinner size="md" text="Loading budgets..." className="py-12" />
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No budgets configured yet"
              subtitle="Set a monthly cost cap using the form on the right to receive proactive phone notifications."
            />
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const status = budgetStatus.find((s) => s.budgetId === b._id);
                return (
                  <BudgetCard
                    key={b._id}
                    budget={b}
                    status={status}
                    onEdit={(budgetToEdit) => setEditingBudget(budgetToEdit)}
                    onDelete={handleDeleteBudget}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column — Budget Form (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <BudgetForm
            services={services}
            editingBudget={editingBudget}
            hasOverallBudget={hasOverallBudget}
            onSubmit={handleFormSubmit}
            onCancel={editingBudget ? () => setEditingBudget(null) : null}
            loading={formLoading}
          />
        </div>
      </div>
    </div>
  );
}
