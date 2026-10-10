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
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mb-4 shadow-sm">
          <Icon className="w-6 h-6 text-slate-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtitle}</p>}
      {(action || actionLabel) && (
        <div className="mt-5">
          {action ? (
            action
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
