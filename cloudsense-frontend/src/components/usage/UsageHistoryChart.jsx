'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function UsageHistoryChart({ history = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="h-60 w-full bg-slate-50 rounded-lg" />
      </div>
    );
  }

  const chartData = [...history]
    .sort((a, b) => new Date(a.snapshotDate || a.createdAt) - new Date(b.snapshotDate || b.createdAt))
    .slice(-10)
    .map((item) => ({
      date: formatDate(item.snapshotDate || item.createdAt),
      cost: item.totalCostUSD || 0,
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs space-y-1">
          <p className="font-semibold text-slate-800">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Snapshot Spend:</span>
            <span className="font-mono font-medium text-blue-600">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Historical Snapshot Trajectory</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Recorded total AWS spend across polling snapshots
        </p>
      </div>

      <div className="h-60 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No historical snapshots recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" name="Cost" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
