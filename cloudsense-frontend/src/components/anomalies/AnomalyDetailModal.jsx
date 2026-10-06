'use client';

import React from 'react';
import {
  X,
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white border-l border-slate-200 p-6 md:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AnomalyBadge severity={anomaly.severity} />
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {anomaly.pattern}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{anomaly.title}</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Monthly Waste Impact</span>
              </p>
              <p className="text-lg font-bold font-mono text-amber-700 mt-1">
                {formatCurrency(anomaly.estimatedMonthlyCostImpact || 0)}/mo
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                <span>Confidence Score</span>
              </p>
              <p className="text-lg font-bold font-mono text-blue-700 mt-1">
                {confidencePct}%
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              AI Anomaly Analysis
            </h4>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 leading-relaxed font-sans shadow-sm">
              {anomaly.description}
            </div>
          </div>

          {/* Recommended Action */}
          {anomaly.recommendedAction && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                <span>Remediation Steps</span>
              </h4>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 text-xs text-blue-900 leading-relaxed font-sans shadow-sm">
                {anomaly.recommendedAction}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Resource Telemetry
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Affected AWS Service:</span>
                <span className="font-semibold text-slate-800">{anomaly.affectedService || 'AWS'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Resource ID:</span>
                <span className="font-mono text-slate-800 truncate max-w-xs">
                  {anomaly.affectedResourceId || 'Global/Account'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Detection Timestamp:</span>
                <span className="text-slate-800 font-mono">
                  {formatDateTime(anomaly.detectedAt || anomaly.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Status:</span>
                <span className="capitalize font-semibold text-slate-800">{anomaly.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
