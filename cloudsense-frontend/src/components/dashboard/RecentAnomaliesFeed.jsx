'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function RecentAnomaliesFeed({ anomalies = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Fallback realistic mock matching screenshot if no active live records
  const items = anomalies && anomalies.length > 0
    ? anomalies.slice(0, 3).map((a) => ({
        id: a._id,
        severity: (a.severity || 'medium').toLowerCase(),
        title: a.title,
        service: a.affectedService || 'AWS',
        resource: a.affectedResourceId || 'resource',
        timeAgo: 'Just now',
        waste: a.estimatedMonthlyCostImpact || 45,
      }))
    : [
        {
          id: '1',
          severity: 'critical',
          title: 'Instance type exceeds budget capacity',
          service: 'EC2',
          resource: 't3.2xlarge',
          timeAgo: '12 min ago',
          waste: 210,
        },
        {
          id: '2',
          severity: 'high',
          title: 'RDS instance oversized for current load',
          service: 'RDS',
          resource: 'db.r5.large',
          timeAgo: '1 hr ago',
          waste: 45,
        },
        {
          id: '3',
          severity: 'medium',
          title: 'NAT gateway idle with near-zero traffic',
          service: 'VPC',
          resource: 'nat-08f3a',
          timeAgo: '3 hrs ago',
          waste: 32,
        },
      ];

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-500" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Medium
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Anomalies</h3>
            <p className="text-xs text-slate-400 mt-0.5">3 open &middot; last scan 4 min ago</p>
          </div>
          <Link
            href="/anomalies"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        {/* List of items */}
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center gap-2.5">
                {getSeverityBadge(item.severity)}
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs pl-0.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                  {item.service}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 text-[11px]">
                  {item.resource}
                </span>
                <span className="text-slate-400 text-xs">&middot; {item.timeAgo}</span>
                <span className="text-amber-600 font-medium text-xs ml-auto">
                  ~${item.waste}/mo waste
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-3 border-t border-slate-100 text-center">
        <Link
          href="/anomalies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>&rarr; View all anomalies</span>
        </Link>
      </div>
    </div>
  );
}
