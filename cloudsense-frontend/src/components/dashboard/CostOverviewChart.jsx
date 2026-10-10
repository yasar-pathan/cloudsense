'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';

export default function CostOverviewChart({ history = [], currentSpend = 84.32, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="h-56 w-full bg-slate-50 rounded-lg" />
      </div>
    );
  }

  // Realistic daily spend curve matching screenshot (Oct 1 to Oct 7)
  const chartData = [
    { day: 'Oct 1', actual: 4.8, projected: null },
    { day: 'Oct 2', actual: 6.2, projected: null },
    { day: 'Oct 3', actual: 7.4, projected: null },
    { day: 'Oct 4', actual: 6.8, projected: null },
    { day: 'Oct 5', actual: 8.5, projected: 8.5 }, // today point
    { day: 'Oct 6', actual: null, projected: 9.8 },
    { day: 'Oct 7', actual: null, projected: 11.2 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs space-y-1">
          <p className="font-semibold text-slate-800">{label}</p>
          {payload.map((entry, index) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <span className="text-slate-500 capitalize">{entry.name}:</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Daily spend</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Oct 1 – Oct 5, actual + projected
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 rounded" />
            <span className="text-slate-600 text-[11px]">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-blue-400" />
            <span className="text-slate-400 text-[11px]">Projected</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
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
              domain={[0, 15]}
              ticks={[0, 5, 10, 15]}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Today indicator vertical line */}
            <ReferenceLine
              x="Oct 5"
              stroke="#cbd5e1"
              strokeDasharray="2 2"
              label={{
                value: 'today',
                position: 'top',
                fill: '#94a3b8',
                fontSize: 10,
                offset: 5,
              }}
            />

            {/* Solid actual curve */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
              connectNulls={false}
            />

            {/* Dashed projected curve */}
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 4, stroke: '#60a5fa', strokeWidth: 2, fill: '#ffffff' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
