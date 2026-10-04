import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StatCard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  icon: Icon,
  iconColor = 'text-blue-500',
  iconBg = 'bg-blue-500/10 border-blue-500/20',
  loading = false,
  className,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-5 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-zinc-800 rounded" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-7 w-32 bg-zinc-800 rounded" />
        <div className="h-3 w-20 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-[#222222] bg-[#111111] p-5 flex flex-col justify-between hover:border-zinc-700/60 transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {Icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
              iconBg
            )}
          >
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-100">{value}</div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trendDirection === 'up' && (
            <span className="text-red-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          {trendDirection === 'down' && (
            <span className="text-green-400 flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          {trendDirection === 'neutral' && (
            <span className="text-zinc-400 flex items-center gap-0.5">
              <Minus className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          <span className="text-zinc-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
