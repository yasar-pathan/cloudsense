import React from 'react';
import { cn, formatPercent } from '../../lib/utils';

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

  let barColor = 'bg-green-500';
  let textColor = 'text-green-400';

  if (percentage >= 100) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
  } else if (percentage >= alertAtPercent) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Budget Consumed</span>
          <span className={cn('font-mono font-semibold', textColor)}>
            {percentage}%
          </span>
        </div>
      )}

      <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
