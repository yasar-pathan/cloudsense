'use client';

import React, { useState, useEffect } from 'react';
import { Target, Loader2, Info } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import ErrorBanner from '../ui/ErrorBanner';

export default function BudgetForm({
  services = [],
  editingBudget = null,
  hasOverallBudget = false,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const isEditing = Boolean(editingBudget);

  const [type, setType] = useState('overall');
  const [service, setService] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertAtPercent, setAlertAtPercent] = useState(80);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingBudget) {
      setType(editingBudget.type || 'overall');
      setService(editingBudget.service || '');
      setMonthlyLimit(editingBudget.monthlyLimit ? String(editingBudget.monthlyLimit) : '');
      setAlertAtPercent(editingBudget.alertAtPercent || 80);
    } else {
      // Default to per_service if overall already exists
      if (hasOverallBudget) {
        setType('per_service');
        if (services.length > 0) setService(services[0].service);
      } else {
        setType('overall');
      }
    }
  }, [editingBudget, hasOverallBudget, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const limitNum = parseFloat(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Monthly limit must be greater than $0');
      return;
    }

    if (type === 'per_service' && !service) {
      setError('Please select an AWS service');
      return;
    }

    const payload = {
      type,
      service: type === 'per_service' ? service : null,
      monthlyLimit: limitNum,
      alertAtPercent: Number(alertAtPercent),
    };

    const res = await onSubmit(payload);
    if (!res?.success) {
      setError(res?.error || 'Failed to save budget');
    }
  };

  const limitVal = parseFloat(monthlyLimit) || 0;
  const alertDollar = (limitVal * (alertAtPercent / 100)).toFixed(2);

  // Selected service cost hint
  const selectedServiceObj = services.find((s) => s.service === service);

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              {isEditing ? 'Edit Budget' : 'Configure New Budget'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isEditing ? 'Update threshold limits' : 'Establish monthly cost boundary'}
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Budget Type Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-2">Budget Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isEditing || (!isEditing && hasOverallBudget)}
              onClick={() => setType('overall')}
              className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                type === 'overall'
                  ? 'border-blue-500 bg-blue-950/30 text-blue-200'
                  : 'border-[#222222] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              } ${!isEditing && hasOverallBudget ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <p>Overall Account</p>
              <p className="text-[11px] font-normal text-zinc-500 mt-0.5">
                Cap entire AWS monthly bill
              </p>
            </button>

            <button
              type="button"
              disabled={isEditing}
              onClick={() => {
                setType('per_service');
                if (!service && services.length > 0) setService(services[0].service);
              }}
              className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                type === 'per_service'
                  ? 'border-blue-500 bg-blue-950/30 text-blue-200'
                  : 'border-[#222222] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <p>Per-Service</p>
              <p className="text-[11px] font-normal text-zinc-500 mt-0.5">
                Target EC2, RDS, Lambda, etc.
              </p>
            </button>
          </div>
          {!isEditing && hasOverallBudget && type === 'per_service' && (
            <p className="text-[11px] text-zinc-500 mt-1.5">
              An overall budget is already active for this account.
            </p>
          )}
        </div>

        {/* Service Dropdown (If per_service) */}
        {type === 'per_service' && (
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Target AWS Service
            </label>
            <select
              value={service}
              disabled={isEditing}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-zinc-100 text-xs focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              <option value="">Select a service...</option>
              {services.map((s) => (
                <option key={s.service} value={s.service} className="bg-zinc-900">
                  {s.serviceName || s.service} — {formatCurrency(s.costUSD)}/mo
                </option>
              ))}
            </select>
            {selectedServiceObj && (
              <p className="text-[11px] text-zinc-400 mt-1">
                Current month spend for this service: {formatCurrency(selectedServiceObj.costUSD)}
              </p>
            )}
          </div>
        )}

        {/* Monthly Limit Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Monthly Limit (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Alert Threshold Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-zinc-300">Alert Trigger Threshold</label>
            <span className="font-mono text-blue-400 font-semibold">{alertAtPercent}%</span>
          </div>

          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={alertAtPercent}
            onChange={(e) => setAlertAtPercent(e.target.value)}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          <p className="text-[11px] text-zinc-400 leading-normal">
            Triggers phone call alert when spend reaches{' '}
            <span className="font-mono text-zinc-200 font-semibold">
              ${alertDollar} ({alertAtPercent}%)
            </span>
            .
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
          {onCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Create Budget'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
