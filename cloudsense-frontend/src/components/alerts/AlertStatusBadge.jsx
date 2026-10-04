import React from 'react';
import { CheckCircle2, PhoneCall, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AlertStatusBadge({ status, className }) {
  const s = (status || 'sent').toLowerCase();

  const styles = {
    sent: {
      color: 'border-blue-500/30 bg-blue-950/40 text-blue-400',
      icon: PhoneCall,
      label: 'Sent',
    },
    acknowledged: {
      color: 'border-green-500/30 bg-green-950/40 text-green-400',
      icon: CheckCircle2,
      label: 'Acknowledged',
    },
    failed: {
      color: 'border-red-500/30 bg-red-950/40 text-red-400',
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
