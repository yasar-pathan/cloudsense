'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ExternalLink,
  DollarSign,
  Layers,
  Wrench,
  Percent,
} from 'lucide-react';
import AnomalyBadge from './AnomalyBadge';
import { formatCurrency, formatDateTime } from '../../lib/utils';

export default function AnomalyCard({ anomaly, onStatusChange, onViewDetails }) {
  const [showFix, setShowFix] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (status) => {
    setUpdating(true);
    try {
      await onStatusChange(anomaly._id, status);
    } finally {
      setUpdating(false);
    }
  };

  const isResolved = anomaly.status === 'resolved';
  const isDismissed = anomaly.status === 'dismissed';
  const isOpen = anomaly.status === 'open' || anomaly.status === 'alerted';

  const confidencePct = Math.round((anomaly.confidenceScore || 0) * 100);

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-5 space-y-4 hover:border-zinc-700/60 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <AnomalyBadge severity={anomaly.severity} />
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-[#222222]">
            {anomaly.pattern}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
              isResolved
                ? 'border-green-500/30 bg-green-950/40 text-green-400'
                : isDismissed
                ? 'border-zinc-700 bg-zinc-800 text-zinc-400'
                : 'border-red-500/30 bg-red-950/40 text-red-400'
            }`}
          >
            {anomaly.status}
          </span>
          <span className="text-xs text-zinc-400">
            {formatDateTime(anomaly.detectedAt || anomaly.createdAt)}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h4 className="text-base font-semibold text-zinc-100">{anomaly.title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {anomaly.description}
        </p>
      </div>

      {/* Context Chips & Financial Impact */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {anomaly.affectedService && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-[#222222] text-xs text-zinc-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{anomaly.affectedService}</span>
          </div>
        )}

        {anomaly.affectedResourceId && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-[#222222] text-xs font-mono text-zinc-300 truncate max-w-xs">
            <span>id: {anomaly.affectedResourceId}</span>
          </div>
        )}

        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-[#222222] text-xs text-zinc-400">
          <Percent className="w-3 h-3 text-cyan-400" />
          <span>{confidencePct}% confidence</span>
        </div>

        {anomaly.estimatedMonthlyCostImpact > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/30 border border-red-800/40 text-xs font-semibold text-red-400 ml-auto">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Estimated waste: {formatCurrency(anomaly.estimatedMonthlyCostImpact)}/mo</span>
          </div>
        )}
      </div>

      {/* Collapsible Recommended Action */}
      {anomaly.recommendedAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowFix(!showFix)}
            className="flex items-center justify-between w-full text-xs font-medium text-zinc-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-[#161616] border border-[#222222]"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Action & Remediation</span>
            </div>
            {showFix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFix && (
            <div className="mt-2 p-3.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-xs text-zinc-300 leading-relaxed font-sans space-y-1">
              <p>{anomaly.recommendedAction}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
        <button
          type="button"
          onClick={() => onViewDetails(anomaly)}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Full Details →
        </button>

        {isOpen && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdate('dismissed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdate('resolved')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-green-500/30 bg-green-950/30 text-green-300 hover:bg-green-900/40 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span>Mark Resolved</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
