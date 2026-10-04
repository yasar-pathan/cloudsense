'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  PhoneCall,
  ChevronDown,
  ChevronUp,
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
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-4 animate-pulse">
        <div className="h-5 w-40 bg-zinc-800 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 w-full bg-zinc-800/40 rounded-lg" />
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
    <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#222222] bg-zinc-950/60 text-zinc-400 font-medium select-none">
              <th className="py-3 px-4">Alert Type</th>
              <th className="py-3 px-4">Message Preview</th>
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Sent At</th>
              <th className="py-3 px-4">Acknowledged</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222] text-zinc-300">
            {alerts.map((item) => {
              const isBreach = item.type === 'budget_breach';
              const isExpanded = expandedAlert === item._id;

              return (
                <React.Fragment key={item._id}>
                  <tr
                    onClick={() => toggleExpand(item._id)}
                    className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-medium">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isBreach
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isBreach ? (
                            <DollarSign className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="capitalize">
                          {item.type ? item.type.replace('_', ' ') : 'Alert'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-zinc-400">
                      {item.message}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-blue-400" />
                        <span>Voice Call</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <AlertStatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDateTime(item.sentAt || item.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {item.acknowledgedAt ? formatDateTime(item.acknowledgedAt) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'sent' && (
                        <button
                          type="button"
                          disabled={ackLoading === item._id}
                          onClick={(e) => handleAcknowledge(e, item._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Message Box */}
                  {isExpanded && (
                    <tr className="bg-[#0c0c0c]">
                      <td colSpan={7} className="p-4 border-t border-[#222222]">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-zinc-300">
                            Full Spoken TwiML Message
                          </p>
                          <p className="p-3 rounded-lg border border-[#222222] bg-zinc-950 font-sans text-xs text-zinc-300 leading-relaxed">
                            {item.message}
                          </p>
                          {item.twilioCallSid && (
                            <p className="text-[11px] font-mono text-zinc-500">
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
      <div className="md:hidden divide-y divide-[#222222]">
        {alerts.map((item) => (
          <div key={item._id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200 capitalize">
                  {item.type?.replace('_', ' ')}
                </span>
              </div>
              <AlertStatusBadge status={item.status} />
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{item.message}</p>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>{formatDateTime(item.sentAt || item.createdAt)}</span>
              {item.status === 'sent' && (
                <button
                  type="button"
                  onClick={(e) => handleAcknowledge(e, item._id)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-xs font-medium text-zinc-200"
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
