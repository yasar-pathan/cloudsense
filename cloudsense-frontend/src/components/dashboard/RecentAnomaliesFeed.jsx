'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import AnomalyBadge from '../anomalies/AnomalyBadge';
import { formatDateTime, formatCurrency } from '../../lib/utils';

export default function RecentAnomaliesFeed({ anomalies = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-zinc-800/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const openAnomalies = (anomalies || []).filter((a) => a.status === 'open' || a.status === 'alerted').slice(0, 5);

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Recent Anomalies</h3>
            <p className="text-xs text-zinc-400 mt-0.5">High-priority cost leaks needing attention</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 border border-red-800/50 text-red-400">
            {openAnomalies.length} Open
          </span>
        </div>

        {openAnomalies.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">No anomalies detected</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Your AWS resources are running within normal parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#222222] py-1">
            {openAnomalies.map((item) => (
              <div key={item._id} className="py-3.5 flex items-start justify-between gap-3 group">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AnomalyBadge severity={item.severity} />
                    <span className="text-xs text-zinc-400 truncate">
                      {item.affectedService || 'AWS Service'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{formatDateTime(item.detectedAt || item.createdAt)}</span>
                    {item.estimatedMonthlyCostImpact > 0 && (
                      <span className="text-amber-400 font-mono">
                        +{formatCurrency(item.estimatedMonthlyCostImpact)}/mo
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/anomalies"
                  className="px-2.5 py-1 rounded border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors shrink-0 mt-1"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#222222]">
        <Link
          href="/anomalies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>View all anomalies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
