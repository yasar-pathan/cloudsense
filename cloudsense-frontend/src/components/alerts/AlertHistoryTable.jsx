'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import AlertStatusBadge from './AlertStatusBadge';
import EmptyState from '../ui/EmptyState';
import { formatDateTime } from '../../lib/utils';

export default function AlertHistoryTable({ alerts = [], onAcknowledge, loading = false }) {
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [ackLoading, setAckLoading] = useState(null);

  const toggleExpand = (id) => {
    setExpandedAlert(expandedAlert === id ? null : id);
  };

  const handleAcknowledge = async (e, id) => {
    e.stopPropagation();
    setAckLoading(id);
    try {
      await onAcknowledge(id);
    } finally {
      setAckLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 animate-pulse shadow-sm">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No alerts triggered yet"
        subtitle="Automated phone alerts appear here when active budgets are exceeded or critical anomalies are detected."
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-medium select-none">
              <th className="py-3 px-4">Alert Type</th>
              <th className="py-3 px-4">Message Preview</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Sent At</th>
              <th className="py-3 px-4">Acknowledged</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {alerts.map((item) => {
              const isBreach = item.type === 'budget_breach';
              const isExpanded = expandedAlert === item._id;

              return (
                <React.Fragment key={item._id}>
                  <tr
                    onClick={() => toggleExpand(item._id)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-medium">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isBreach
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {isBreach ? (
                            <DollarSign className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="capitalize text-slate-800">
                          {item.type ? item.type.replace('_', ' ') : 'Alert'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                      {item.message}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <PhoneCall className="w-3 h-3 text-blue-600" />
                        <span>Voice Call</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <AlertStatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(item.sentAt || item.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {item.acknowledgedAt ? formatDateTime(item.acknowledgedAt) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'sent' && (
                        <button
                          type="button"
                          disabled={ackLoading === item._id}
                          onClick={(e) => handleAcknowledge(e, item._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Message Box */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="p-4 border-t border-slate-200">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700">
                            Full Spoken TwiML Message
                          </p>
                          <p className="p-3 rounded-lg border border-slate-200 bg-white font-sans text-xs text-slate-700 leading-relaxed shadow-sm">
                            {item.message}
                          </p>
                          {item.twilioCallSid && (
                            <p className="text-[11px] font-mono text-slate-400">
                              Twilio Call SID: {item.twilioCallSid}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden divide-y divide-slate-100">
        {alerts.map((item) => (
          <div key={item._id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 capitalize">
                  {item.type?.replace('_', ' ')}
                </span>
              </div>
              <AlertStatusBadge status={item.status} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{formatDateTime(item.sentAt || item.createdAt)}</span>
              {item.status === 'sent' && (
                <button
                  type="button"
                  onClick={(e) => handleAcknowledge(e, item._id)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800"
                >
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
