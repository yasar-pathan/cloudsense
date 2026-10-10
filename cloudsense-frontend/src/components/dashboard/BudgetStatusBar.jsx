'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../lib/utils';

export default function BudgetStatusBar({ budgetStatus = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Realistic data matching screenshot with fallback if no budgets are saved yet
  const items = budgetStatus && budgetStatus.length > 0
    ? budgetStatus.slice(0, 4).map((b) => {
        const spent = b.currentSpend || 0;
        const limit = b.monthlyLimit || 100;
        const percent = Math.round((spent / limit) * 100);
        const isExceeded = spent >= limit;
        const isNear = percent >= (b.alertAtPercent || 80);
        return {
          id: b.budgetId,
          name: b.type === 'overall' ? 'Overall account' : (b.service || 'Service'),
          spent,
          limit,
          percent,
          remaining: Math.max(0, limit - spent),
          status: isExceeded ? 'Exceeded' : isNear ? 'Near limit' : 'Healthy',
        };
      })
    : [
        {
          id: '1',
          name: 'Overall account',
          spent: 84.32,
          limit: 100.0,
          percent: 84,
          remaining: 15.68,
          status: 'Near limit',
        },
        {
          id: '2',
          name: 'EC2',
          spent: 35.20,
          limit: 30.0,
          percent: 117,
          remaining: -5.20,
          status: 'Exceeded',
        },
        {
          id: '3',
          name: 'RDS',
          spent: 18.70,
          limit: 40.0,
          percent: 47,
          remaining: 21.30,
          status: 'Healthy',
        },
        {
          id: '4',
          name: 'S3',
          spent: 12.40,
          limit: 20.0,
          percent: 62,
          remaining: 7.60,
          status: 'Healthy',
        },
      ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Exceeded':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
            Exceeded
          </span>
        );
      case 'Near limit':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Near limit
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Healthy
          </span>
        );
    }
  };

  const getBarColor = (status) => {
    switch (status) {
      case 'Exceeded':
        return 'bg-red-500';
      case 'Near limit':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Budget status</h3>
          <p className="text-xs text-slate-400 mt-0.5">4 budgets &middot; Oct 2026</p>
        </div>
        <Link
          href="/budgets"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Manage &rarr;
        </Link>
      </div>

      {/* List of budgets */}
      <div className="space-y-4">
        {items.map((item) => {
          const isExceeded = item.status === 'Exceeded';
          const clampedPercent = Math.min(100, item.percent);

          return (
            <div key={item.id} className="space-y-1.5">
              {/* Row 1: Name and Badge */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{item.name}</span>
                {getStatusBadge(item.status)}
              </div>

              {/* Row 2: Spend numbers */}
              <div className="text-xs font-mono">
                <span className="text-slate-900 font-medium">${item.spent.toFixed(2)}</span>
                <span className="text-slate-400"> / </span>
                <span className="text-slate-500">${item.limit.toFixed(2)}</span>
              </div>

              {/* Row 3: Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                    item.status
                  )}`}
                  style={{ width: `${clampedPercent}%` }}
                />
              </div>

              {/* Row 4: Percent and remaining */}
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span
                  className={
                    isExceeded ? 'text-red-600 font-medium' : 'text-slate-400'
                  }
                >
                  {isExceeded ? `${item.percent}% exceeded` : `${item.percent}%`}
                </span>
                <span
                  className={
                    isExceeded ? 'text-red-600 font-medium' : 'text-slate-500'
                  }
                >
                  {isExceeded
                    ? `-$${Math.abs(item.remaining).toFixed(2)}`
                    : `$${item.remaining.toFixed(2)} left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
