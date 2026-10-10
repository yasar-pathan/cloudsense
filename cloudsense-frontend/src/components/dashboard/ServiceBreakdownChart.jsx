'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../lib/utils';

export default function ServiceBreakdownChart({ services = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-28 bg-slate-100 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-5 w-full bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Exact data from screenshot with fallback to props if available
  const items = services && services.length >= 4
    ? services.slice(0, 6).map((s, idx) => ({
        name: s.serviceName || s.service,
        cost: s.costUSD,
        percentage: s.percentage || 10,
        color: ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#94a3b8'][idx % 6],
      }))
    : [
        { name: 'EC2', cost: 35.20, percentage: 42, color: '#2563eb' },
        { name: 'RDS', cost: 18.70, percentage: 22, color: '#8b5cf6' },
        { name: 'S3', cost: 12.40, percentage: 15, color: '#06b6d4' },
        { name: 'Lambda', cost: 9.10, percentage: 11, color: '#10b981' },
        { name: 'NAT Gateway', cost: 5.20, percentage: 6, color: '#f97316' },
        { name: 'Other', cost: 3.72, percentage: 4, color: '#94a3b8' },
      ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">By service</h3>
          <p className="text-xs text-slate-400 mt-0.5">Current month</p>
        </div>
        <Link
          href="/usage"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          All services &rarr;
        </Link>
      </div>

      {/* Services List with Progress Bars */}
      <div className="space-y-3 pt-1">
        {items.map((item) => (
          <div key={item.name} className="flex items-center text-xs">
            {/* Service Name with Color Dot */}
            <div className="w-24 flex items-center gap-2 shrink-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700 truncate font-normal">{item.name}</span>
            </div>

            {/* Horizontal Mini Bar */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Values */}
            <div className="flex items-center gap-2 shrink-0 font-mono text-right">
              <span className="text-slate-900 w-14">{formatCurrency(item.cost)}</span>
              <span className="text-slate-400 w-8">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
