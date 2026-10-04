'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Bell,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import AlertHistoryTable from '../../../components/alerts/AlertHistoryTable';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useAppStore } from '../../../store/useAppStore';
import { useAlerts } from '../../../hooks/useAlerts';
import { useAuth } from '../../../hooks/useAuth';

export default function AlertsPage() {
  const { activeConnection } = useAppStore();
  const { user } = useAuth();
  const { alerts, getAlerts, acknowledgeAlert, testCall, loading, error } = useAlerts();

  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testingCall, setTestingCall] = useState(false);
  const [callToast, setCallToast] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const loadAlerts = async () => {
    if (!activeConnection?._id) return;
    const filters = { connectionId: activeConnection._id };
    if (filterType !== 'all') filters.type = filterType;
    await getAlerts(filters);
  };

  useEffect(() => {
    loadAlerts();
  }, [activeConnection?._id, filterType]);

  useEffect(() => {
    if (user?.phone) {
      setTestPhoneNumber(user.phone);
    }
  }, [user?.phone]);

  const handleTestCallSubmit = async (e) => {
    e.preventDefault();
    if (!testPhoneNumber) return;
    setTestingCall(true);
    setCallToast(null);

    const res = await testCall(testPhoneNumber);
    setTestingCall(false);
    setShowTestModal(false);

    if (res.success) {
      setCallToast(`Test phone call initiated to ${testPhoneNumber}. Your phone should ring shortly.`);
      setTimeout(() => setCallToast(null), 6000);
      await loadAlerts();
    } else {
      setCallToast(`Failed to initiate test call: ${res.error}`);
    }
  };

  if (!activeConnection) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100">No AWS Account Connected</h3>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Connect your AWS account via STS AssumeRole to enable automated budget & anomaly alerting.
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <span>Connect AWS Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Alert Notifications"
        subtitle="Automated Twilio Voice phone call history with interactive DTMF acknowledgment tracking"
        actions={
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Test Phone Call</span>
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadAlerts} />}

      {callToast && (
        <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-200 text-xs flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{callToast}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#222222] bg-[#111111]">
        <div className="flex items-center gap-2">
          {['all', 'budget_breach', 'anomaly_detected'].map((typeKey) => {
            const isSelected = filterType === typeKey;
            const labels = {
              all: 'All Alerts',
              budget_breach: 'Budget Breaches',
              anomaly_detected: 'Anomalies',
            };
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setFilterType(typeKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {labels[typeKey]}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-zinc-400 font-mono">
          {alerts.length} record{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Table */}
      <AlertHistoryTable
        alerts={alerts}
        loading={loading}
        onAcknowledge={acknowledgeAlert}
      />

      {/* Test Phone Call Dialog Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-[#222222] bg-[#111111] p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowTestModal(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Send Test Phone Call</h3>
                <p className="text-xs text-zinc-400">
                  Verify your Twilio voice dispatch and phone connectivity.
                </p>
              </div>
            </div>

            <form onSubmit={handleTestCallSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Destination Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+14155552671"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#222222] bg-[#0c0c0c] text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Must include country code (e.g. +1... or +91...).
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#222222] bg-[#0c0c0c] text-xs text-zinc-400 leading-relaxed">
                CloudSense will place an automated text-to-speech call using Amazon Polly to verify
                your alerts setup.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testingCall || !testPhoneNumber}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {testingCall && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{testingCall ? 'Initiating Call...' : 'Place Test Call'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
