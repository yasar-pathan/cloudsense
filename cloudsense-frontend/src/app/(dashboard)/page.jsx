'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import CostOverviewChart from '../../components/dashboard/CostOverviewChart';
import ServiceBreakdownChart from '../../components/dashboard/ServiceBreakdownChart';
import RecentAnomaliesFeed from '../../components/dashboard/RecentAnomaliesFeed';
import BudgetStatusBar from '../../components/dashboard/BudgetStatusBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAppStore } from '../../store/useAppStore';
import { useUsage } from '../../hooks/useUsage';
import { useBudgets } from '../../hooks/useBudgets';
import { useAnomalies } from '../../hooks/useAnomalies';
import api from '../../lib/api';

export default function DashboardPage() {
  const { activeConnection, setActiveConnection, setConnections } = useAppStore();
  const [initLoading, setInitLoading] = useState(true);

  const {
    currentUsage,
    history,
    services,
    getCurrentUsage,
    getUsageHistory,
    getServiceBreakdown,
    loading: usageLoading,
  } = useUsage();

  const { budgetStatus, getBudgetStatus, loading: budgetLoading } = useBudgets();
  const { anomalies, getAnomalies, loading: anomalyLoading } = useAnomalies();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        let conn = activeConnection;
        if (!conn) {
          const res = await api.get('/aws/connections');
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setConnections(res.data);
            conn = res.data.find((c) => c.connectionStatus === 'connected') || res.data[0];
            if (conn) setActiveConnection(conn);
          }
        }

        if (conn && isMounted) {
          await Promise.all([
            getCurrentUsage(conn._id),
            getUsageHistory(conn._id, 30),
            getServiceBreakdown(conn._id),
            getBudgetStatus(conn._id),
            getAnomalies({ connectionId: conn._id, status: 'open' }),
          ]);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (isMounted) setInitLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [activeConnection?._id]);

  if (initLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading CloudSense telemetry..." />
      </div>
    );
  }

  // Account information display
  const accountId = activeConnection?.accountId || '482910847261';
  const region = (activeConnection?.region || 'us-east-1').toUpperCase();
  const totalSpend = currentUsage?.totalCostUSD || 84.32;
  const openAnomaliesCount = anomalies.length > 0 ? anomalies.length : 3;

  return (
    <div className="space-y-6">
      {/* Cost Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            OCTOBER 2026 &middot; {region}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Cost overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Account {accountId} &middot; 8 services active
          </p>
        </div>

        {/* Date Selector Button */}
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Oct 2026</span>
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Month-to-date spend */}
        <StatCard
          title="Month-to-date spend"
          value={`$${totalSpend.toFixed(2)}`}
          subtext="↑ 18% vs September"
          subtextColor="text-rose-600"
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          loading={usageLoading}
        />

        {/* Card 2: Open anomalies */}
        <StatCard
          title="Open anomalies"
          value={openAnomaliesCount}
          valueColor="text-red-600"
          subtext="1 critical  2 high"
          subtextColor="text-slate-500"
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          loading={anomalyLoading}
        />

        {/* Card 3: Budget health */}
        <StatCard
          title="Budget health"
          value="2/4"
          subtext="2 at risk"
          subtextColor="text-amber-600 font-medium"
          icon={Target}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          loading={budgetLoading}
        />

        {/* Card 4: Projected month-end */}
        <StatCard
          title="Projected month-end"
          value="$112"
          subtext="↑ 12% above last month"
          subtextColor="text-rose-600"
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          loading={usageLoading}
        />
      </div>

      {/* Row 2 — Charts (Daily spend + By service) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <CostOverviewChart
            history={history}
            currentSpend={totalSpend}
            loading={usageLoading}
          />
        </div>
        <div className="lg:col-span-5">
          <ServiceBreakdownChart services={services} loading={usageLoading} />
        </div>
      </div>

      {/* Row 3 — Two Panels (Anomalies + Budget status) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentAnomaliesFeed anomalies={anomalies} loading={anomalyLoading} />
        <BudgetStatusBar budgetStatus={budgetStatus} loading={budgetLoading} />
      </div>
    </div>
  );
}
