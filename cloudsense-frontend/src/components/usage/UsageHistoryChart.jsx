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
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded" />
        <div className="h-60 w-full bg-zinc-800/40 rounded-lg" />
      </div>
    );
  }

  // Format data
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
        <div className="rounded-lg border border-[#222222] bg-[#0c0c0c] p-3 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-zinc-200">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Total Snapshot Spend:</span>
            <span className="font-mono font-medium text-blue-400">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">Historical Snapshot Trajectory</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Recorded total AWS spend across polling snapshots
        </p>
      </div>

      <div className="h-60 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">
            No historical snapshots recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" name="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
