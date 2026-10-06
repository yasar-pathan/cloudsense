import React from 'react';
import { CheckCircle2, PhoneCall, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AlertStatusBadge({ status, className }) {
  const s = (status || 'sent').toLowerCase();

  const styles = {
    sent: {
      color: 'border-blue-200 bg-blue-50 text-blue-700',
      icon: PhoneCall,
      label: 'Sent',
    },
    acknowledged: {
      color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
      label: 'Acknowledged',
    },
    failed: {
      color: 'border-red-200 bg-red-50 text-red-700',
      icon: XCircle,
      label: 'Failed',
    },
  };

  const current = styles[s] || styles.sent;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        current.color,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>{current.label}</span>
    </span>
  );
}
