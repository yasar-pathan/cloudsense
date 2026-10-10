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
        'w-full flex items-center justify-between gap-3 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm transition-all',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        <span className="font-normal">{message}</span>
      </div>

      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-red-100 border border-red-200 text-red-700 text-xs font-medium transition-colors"
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
            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
