'use client';

import React from 'react';
import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';
import BudgetProgressBar from '../budgets/BudgetProgressBar';
import { formatCurrency } from '../../lib/utils';

export default function BudgetStatusBar({ budgetStatus = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-36 bg-zinc-800 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 w-full bg-zinc-800/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Budget Health</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Threshold tracking & burn rate</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
            {budgetStatus.length} Active
          </span>
        </div>

        {budgetStatus.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">No budgets configured yet</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Set spending limits to trigger alerts before cloud costs overrun.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#222222] py-1">
            {budgetStatus.slice(0, 4).map((b) => {
              const label = b.type === 'overall' ? 'Overall Account' : b.service || 'Service';
              return (
                <div key={b.budgetId} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{label}</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-zinc-100 font-medium">
                        {formatCurrency(b.currentSpend)}
                      </span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-zinc-400">{formatCurrency(b.monthlyLimit)}</span>
                    </div>
                  </div>

                  <BudgetProgressBar
                    current={b.currentSpend}
                    limit={b.monthlyLimit}
                    alertAtPercent={b.alertAtPercent}
                    showLabel={false}
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Alerts at {b.alertAtPercent}%</span>
                    <span>
                      {b.isBreached ? (
                        <span className="text-red-400 font-semibold">Exceeded</span>
                      ) : b.isNearBreached ? (
                        <span className="text-amber-400 font-semibold">Near Limit</span>
                      ) : (
                        <span className="text-green-400 font-semibold">Healthy</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#222222]">
        <Link
          href="/budgets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>Manage budgets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
