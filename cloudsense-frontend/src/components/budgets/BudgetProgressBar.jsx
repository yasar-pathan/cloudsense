import React from 'react';
import { cn } from '../../lib/utils';

export default function BudgetProgressBar({
  current = 0,
  limit = 100,
  alertAtPercent = 80,
  showLabel = true,
  className,
}) {
  const safeLimit = limit > 0 ? limit : 1;
  const percentage = Math.round((current / safeLimit) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';

  if (percentage >= 100) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600';
  } else if (percentage >= alertAtPercent) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-600';
  }

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Budget Consumed</span>
          <span className={cn('font-mono font-semibold', textColor)}>
            {percentage}%
          </span>
        </div>
      )}

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
