import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AnomalyBadge({ severity, className, showIcon = true }) {
  const sev = (severity || 'low').toLowerCase();

  const styles = {
    critical: {
      color: 'bg-red-950/60 text-red-400 border-red-800/80',
      icon: AlertOctagon,
      label: 'Critical',
    },
    high: {
      color: 'bg-orange-950/60 text-orange-400 border-orange-800/80',
      icon: AlertTriangle,
      label: 'High',
    },
    medium: {
      color: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
      icon: AlertCircle,
      label: 'Medium',
    },
    low: {
      color: 'bg-blue-950/60 text-blue-400 border-blue-800/80',
      icon: Info,
      label: 'Low',
    },
  };

  const current = styles[sev] || styles.low;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        current.color,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
}
