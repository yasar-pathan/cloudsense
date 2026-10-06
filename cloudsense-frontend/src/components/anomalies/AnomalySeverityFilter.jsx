'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export default function AnomalySeverityFilter({
  selectedSeverity,
  onSelectSeverity,
  selectedStatus,
  onSelectStatus,
  severityCounts = { critical: 0, high: 0, medium: 0, low: 0 },
}) {
  const severities = [
    { id: 'all', label: 'All Severities' },
    { id: 'critical', label: 'Critical', count: severityCounts.critical },
    { id: 'high', label: 'High', count: severityCounts.high },
    { id: 'medium', label: 'Medium', count: severityCounts.medium },
    { id: 'low', label: 'Low', count: severityCounts.low },
  ];

  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'open', label: 'Open' },
    { id: 'alerted', label: 'Alerted' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Severities Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {severities.map((s) => {
          const isSelected = (selectedSeverity || 'all') === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSeverity(s.id === 'all' ? '' : s.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              )}
            >
              <span>{s.label}</span>
              {s.count !== undefined && s.count > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {s.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-500">Status:</span>
        <select
          value={selectedStatus || 'all'}
          onChange={(e) => onSelectStatus(e.target.value === 'all' ? '' : e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 shadow-sm focus:outline-none focus:border-blue-600 transition-colors"
        >
          {statuses.map((st) => (
            <option key={st.id} value={st.id} className="text-slate-800">
              {st.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
