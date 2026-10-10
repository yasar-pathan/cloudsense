import React from 'react';
import { cn } from '../../lib/utils';

export default function StatCard({
  title,
  value,
  subtext,
  valueColor = 'text-slate-900',
  subtextColor = 'text-slate-500',
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  loading = false,
  className,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-100 rounded" />
          <div className="h-7 w-7 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-7 w-28 bg-slate-100 rounded" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all min-h-[110px]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-normal text-slate-500">{title}</span>
        {Icon && (
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              iconBg
            )}
          >
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className={cn('text-2xl font-bold tracking-tight', valueColor)}>
          {value}
        </div>
      </div>

      {subtext && (
        <div className={cn('mt-2 text-xs', subtextColor)}>
          {subtext}
        </div>
      )}
    </div>
  );
}
