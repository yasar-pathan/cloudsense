'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <AnomalyBadge severity={anomaly.severity} />
          <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {anomaly.pattern}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
              isResolved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isDismissed
                ? 'border-slate-200 bg-slate-100 text-slate-500'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {anomaly.status}
          </span>
          <span className="text-xs text-slate-400">
            {formatDateTime(anomaly.detectedAt || anomaly.createdAt)}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h4 className="text-base font-semibold text-slate-900">{anomaly.title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {anomaly.description}
        </p>
      </div>

      {/* Context Chips & Financial Impact */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {anomaly.affectedService && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{anomaly.affectedService}</span>
          </div>
        )}

        {anomaly.affectedResourceId && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs font-mono text-slate-600 truncate max-w-xs">
            <span>id: {anomaly.affectedResourceId}</span>
          </div>
        )}

        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-500">
          <Percent className="w-3 h-3 text-cyan-600" />
          <span>{confidencePct}% confidence</span>
        </div>

        {anomaly.estimatedMonthlyCostImpact > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 ml-auto">
            <span>Estimated waste: {formatCurrency(anomaly.estimatedMonthlyCostImpact)}/mo</span>
          </div>
        )}
      </div>

      {/* Collapsible Recommended Action */}
      {anomaly.recommendedAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFix(!showFix)}
            className="flex items-center justify-between w-full text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommended Action & Remediation</span>
            </div>
            {showFix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFix && (
            <div className="mt-2 p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-700 leading-relaxed font-sans space-y-1">
              <p>{anomaly.recommendedAction}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onViewDetails(anomaly)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Full Details &rarr;
        </button>

        {isOpen && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdate('dismissed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => handleUpdate('resolved')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark Resolved</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
