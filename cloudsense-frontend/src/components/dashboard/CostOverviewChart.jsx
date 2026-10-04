'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function CostOverviewChart({ history = [], currentSpend = 0, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded" />
        <div className="h-64 w-full bg-zinc-800/50 rounded-lg" />
      </div>
    );
  }

  // Transform historical snapshots into chart points
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.snapshotDate || a.createdAt) - new Date(b.snapshotDate || b.createdAt)
  );

  let chartData = [];

  if (sortedHistory.length > 0) {
    chartData = sortedHistory.map((snap) => {
      const date = snap.snapshotDate || snap.createdAt;
      const actual = snap.totalCostUSD || 0;
      return {
        date: formatDate(date),
        actualCost: actual,
        projectedCost: Math.round(actual * 1.15 * 100) / 100,
      };
    });
  } else {
    // Generate current month trajectory from currentSpend
    const now = new Date();
    const daysElapsed = Math.max(1, now.getUTCDate());
    const dailyRate = currentSpend / daysElapsed;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const points = [
      { day: 1, actual: dailyRate * 1, projected: dailyRate * 1 },
      { day: Math.min(daysElapsed, 7), actual: dailyRate * 7, projected: dailyRate * 7.2 },
      { day: Math.min(daysElapsed, 15), actual: dailyRate * 15, projected: dailyRate * 15.5 },
      { day: daysElapsed, actual: currentSpend, projected: currentSpend },
      { day: daysInMonth, actual: null, projected: Math.round(dailyRate * daysInMonth * 100) / 100 },
    ];

    chartData = points.map((p) => ({
      date: `Day ${p.day}`,
      actualCost: p.actual ? Math.round(p.actual * 100) / 100 : null,
      projectedCost: p.projected,
    }));
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[#222222] bg-[#0c0c0c] p-3 shadow-xl text-xs space-y-1.5">
          <p className="font-semibold text-zinc-200">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-zinc-400 capitalize">{entry.name}:</span>
              <span className="font-mono font-medium text-zinc-100">
                {entry.value !== null ? formatCurrency(entry.value) : '—'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Spend Overview & Projections</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Current month spend vs. estimated end-of-month run-rate
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-zinc-300">Actual Spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-zinc-400" />
            <span className="text-zinc-400">Projected Run-rate</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="actualCost"
              name="Actual Spend"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#costGradient)"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projectedCost"
              name="Projected"
              stroke="#71717a"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={0}
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
