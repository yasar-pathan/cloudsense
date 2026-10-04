import React from 'react';
import { cn } from '../../lib/utils';

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  actionLabel,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-[#222222] bg-[#111111]/40',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-[#222222] flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
          <Icon className="w-6 h-6 text-zinc-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {subtitle && <p className="text-sm text-zinc-400 mt-1 max-w-sm">{subtitle}</p>}
      {(action || actionLabel) && (
        <div className="mt-5">
          {action ? (
            action
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
