import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AnomalyBadge({ severity, className, showIcon = true }) {
  const sev = (severity || 'low').toLowerCase();

  const styles = {
    critical: {
      color: 'bg-red-50 text-red-600 border-red-200',
      icon: AlertCircle,
      label: 'Critical',
    },
    high: {
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      icon: AlertTriangle,
      label: 'High',
    },
    medium: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      label: 'Medium',
    },
    low: {
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Info,
      label: 'Low',
    },
  };

  const current = styles[sev] || styles.low;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border capitalize',
        current.color,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
}
