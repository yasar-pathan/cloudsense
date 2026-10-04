'use client';

import React from 'react';
import { AlertCircle, X, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ErrorBanner({ message, onRetry, onDismiss, className }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'w-full flex items-center justify-between gap-3 p-3.5 rounded-lg border border-red-500/20 bg-red-950/40 text-red-300 text-sm transition-all',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="font-normal">{message}</span>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-medium transition-colors"
          >
            <RotateCw className="w-3 h-3" />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1 rounded text-red-400 hover:text-red-200 hover:bg-red-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
