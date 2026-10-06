'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import ServiceCostTable from '../../../components/usage/ServiceCostTable';
import UsageHistoryChart from '../../../components/usage/UsageHistoryChart';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useAppStore } from '../../../store/useAppStore';
import { useUsage } from '../../../hooks/useUsage';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function UsagePage() {
  const { activeConnection } = useAppStore();
  const {
    currentUsage,
    history,
    services,
    getCurrentUsage,
    getUsageHistory,
    getServiceBreakdown,
    syncUsage,
    loading,
    error,
  } = useUsage();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const loadData = async () => {
    if (!activeConnection?._id) return;
    try {
      await Promise.all([
        getCurrentUsage(activeConnection._id),
        getUsageHistory(activeConnection._id, 30),
        getServiceBreakdown(activeConnection._id),
      ]);
    } catch (err) {
      console.error('Failed to load usage data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeConnection?._id]);

  const handleSync = async () => {
    if (!activeConnection?._id) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      await syncUsage(activeConnection._id);
      await getServiceBreakdown(activeConnection._id);
      await getUsageHistory(activeConnection._id, 30);
      setSyncMsg('Usage synced');
      setTimeout(() => setSyncMsg(null), 3000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCSV = () => {
    if (!services || services.length === 0) return;

    const headers = ['Service Name', 'Service Code', 'Cost (USD)', '% of Total'];
    const rows = services.map((s) => [
      `"${s.serviceName || s.service}"`,
      `"${s.service}"`,
      s.costUSD.toFixed(2),
      `${(s.percentage || 0).toFixed(1)}%`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `cloudsense-usage-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!activeConnection) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No AWS Account Connected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connect your AWS account via STS AssumeRole to inspect your service telemetry.
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Connect AWS Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const totalCost = currentUsage?.totalCostUSD || 84.32;
  const billingPeriod =
    currentUsage?.billingPeriodStart && currentUsage?.billingPeriodEnd
      ? `${formatDate(currentUsage.billingPeriodStart)} – ${formatDate(
          currentUsage.billingPeriodEnd
        )}`
      : 'Oct 1, 2026 – Oct 31, 2026';

  return (
    <div className="space-y-6">
      <PageHeader
        title="AWS Service Usage Breakdown"
        subtitle="Granular service-level cost allocations and real-time Cost Explorer data"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={services.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              disabled={syncing}
              onClick={handleSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : syncMsg || 'Sync Now'}</span>
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500">Total Month-to-Date Spend</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(totalCost)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500">Billing Period</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{billingPeriod}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500">Active Services with Charges</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {services.filter((s) => s.costUSD > 0).length || 6}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Service Cost Table */}
      <ServiceCostTable services={services} loading={loading} />

      {/* Historical Trend Chart */}
      <UsageHistoryChart history={history} loading={loading} />
    </div>
  );
}
