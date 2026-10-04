'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '../../lib/utils';

const COLORS = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#64748b', // slate
];

export default function ServiceBreakdownChart({ services = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-zinc-800 rounded" />
        <div className="h-48 w-48 rounded-full bg-zinc-800/40 mx-auto" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-zinc-800 rounded" />
          <div className="h-3 w-4/5 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  const validServices = (services || []).filter((s) => s.costUSD > 0);
  const totalCost = validServices.reduce((sum, s) => sum + s.costUSD, 0);

  const topServices = validServices.slice(0, 5);
  const othersCost = validServices.slice(5).reduce((sum, s) => sum + s.costUSD, 0);

  const data = [...topServices];
  if (othersCost > 0) {
    data.push({
      service: 'Other',
      serviceName: 'Other Services',
      costUSD: othersCost,
      percentage: totalCost > 0 ? (othersCost / totalCost) * 100 : 0,
    });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="rounded-lg border border-[#222222] bg-[#0c0c0c] p-2.5 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-zinc-200">{item.serviceName || item.service}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">Cost:</span>
            <span className="font-mono text-zinc-100 font-medium">{formatCurrency(item.costUSD)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">Share:</span>
            <span className="font-mono text-blue-400 font-medium">{formatPercent(item.percentage)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">Service Breakdown</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Top AWS services driving your monthly bill</p>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-zinc-400">
          <p>No active service usage recorded yet</p>
        </div>
      ) : (
        <div className="py-2">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="costUSD"
                  nameKey="serviceName"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="#111111"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-[#222222]">
            {data.slice(0, 4).map((s, idx) => (
              <div key={s.service || idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-zinc-300 truncate">{s.serviceName || s.service}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-zinc-200">{formatCurrency(s.costUSD)}</span>
                  <span className="text-zinc-400 w-10 text-right">{formatPercent(s.percentage)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
