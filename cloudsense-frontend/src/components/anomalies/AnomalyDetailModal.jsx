'use client';

import React from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  Layers,
  Wrench,
  Percent,
  DollarSign,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import AnomalyBadge from './AnomalyBadge';
import { formatCurrency, formatDateTime } from '../../lib/utils';

export default function AnomalyDetailModal({
  anomaly,
  open,
  onClose,
  onStatusChange,
}) {
  if (!open || !anomaly) return null;

  const confidencePct = Math.round((anomaly.confidenceScore || 0) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-[#111111] border-l border-[#222222] p-6 md:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#222222]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AnomalyBadge severity={anomaly.severity} />
                <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-[#222222]">
                  {anomaly.pattern}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">{anomaly.title}</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-[#222222] bg-[#1a1a1a]/50">
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Monthly Waste Impact</span>
              </p>
              <p className="text-lg font-bold font-mono text-amber-400 mt-1">
                {formatCurrency(anomaly.estimatedMonthlyCostImpact || 0)}/mo
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#222222] bg-[#1a1a1a]/50">
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                <span>Confidence Score</span>
              </p>
              <p className="text-lg font-bold font-mono text-cyan-400 mt-1">
                {confidencePct}%
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              AI Anomaly Analysis
            </h4>
            <div className="p-4 rounded-lg border border-[#222222] bg-[#0c0c0c] text-sm text-zinc-200 leading-relaxed">
              {anomaly.description}
            </div>
          </div>

          {/* Recommended Action */}
          {anomaly.recommendedAction && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span>Remediation Steps</span>
              </h4>
              <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-950/20 text-xs text-blue-200 leading-relaxed font-sans">
                {anomaly.recommendedAction}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-2 pt-2 border-t border-[#222222]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Resource Telemetry
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#1f1f1f]">
                <span className="text-zinc-400">Affected AWS Service:</span>
                <span className="font-semibold text-zinc-200">{anomaly.affectedService || 'AWS'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#1f1f1f]">
                <span className="text-zinc-400">Resource ID:</span>
                <span className="font-mono text-zinc-200 truncate max-w-xs">
                  {anomaly.affectedResourceId || 'Global/Account'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#1f1f1f]">
                <span className="text-zinc-400">Detection Timestamp:</span>
                <span className="text-zinc-200 font-mono">
                  {formatDateTime(anomaly.detectedAt || anomaly.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-400">Status:</span>
                <span className="capitalize font-semibold text-zinc-200">{anomaly.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#222222] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {anomaly.status !== 'dismissed' && (
              <button
                type="button"
                onClick={async () => {
                  await onStatusChange(anomaly._id, 'dismissed');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            )}

            {anomaly.status !== 'resolved' && (
              <button
                type="button"
                onClick={async () => {
                  await onStatusChange(anomaly._id, 'resolved');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-500/30 bg-green-950/40 hover:bg-green-900/50 text-green-300 text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
