'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  AlertTriangle,
  Target,
  Cloud,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
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
import { formatCurrency, formatDateTime } from '../../lib/utils';

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

  // Load connection and data
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

  const isConnected = Boolean(activeConnection && activeConnection.isActive);

  // Compute stat card metrics
  const totalSpend = currentUsage?.totalCostUSD || 0;
  const openAnomaliesCount = anomalies.length;

  const healthyBudgetsCount = budgetStatus.filter(
    (b) => !b.isBreached && !b.isNearBreached
  ).length;
  const totalBudgetsCount = budgetStatus.length;

  const servicesCount = services.filter((s) => s.costUSD > 0).length;

  if (initLoading) {
    return <LoadingSpinner size="lg" text="Loading CloudSense telemetry..." className="py-24" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner if No Connection */}
      {!isConnected && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">No AWS Account Connected</h4>
              <p className="text-xs text-zinc-300">
                Connect your AWS account via STS AssumeRole to begin continuous monitoring.
              </p>
            </div>
          </div>
          <Link
            href="/connect"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors shrink-0"
          >
            <span>Connect Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spend This Month"
          value={formatCurrency(totalSpend)}
          trend="+4.2%"
          trendDirection="up"
          icon={DollarSign}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20"
          loading={usageLoading}
        />

        <StatCard
          title="Active Anomalies"
          value={openAnomaliesCount}
          trend={openAnomaliesCount > 0 ? 'Requires attention' : 'All clear'}
          trendDirection={openAnomaliesCount > 0 ? 'neutral' : 'down'}
          icon={AlertTriangle}
          iconColor={openAnomaliesCount > 0 ? 'text-red-400' : 'text-green-400'}
          iconBg={
            openAnomaliesCount > 0
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-green-500/10 border-green-500/20'
          }
          loading={anomalyLoading}
        />

        <StatCard
          title="Budget Health"
          value={
            totalBudgetsCount > 0
              ? `${healthyBudgetsCount} of ${totalBudgetsCount} healthy`
              : 'None set'
          }
          trend={totalBudgetsCount > 0 ? `${totalBudgetsCount} active` : 'Configure'}
          trendDirection="neutral"
          icon={Target}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          loading={budgetLoading}
        />

        <StatCard
          title="AWS Services Tracked"
          value={servicesCount}
          trend="Real-time"
          trendDirection="neutral"
          icon={Cloud}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10 border-cyan-500/20"
          loading={usageLoading}
        />
      </div>

      {/* Row 2 — Charts (8 / 4 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <CostOverviewChart
            history={history}
            currentSpend={totalSpend}
            loading={usageLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <ServiceBreakdownChart services={services} loading={usageLoading} />
        </div>
      </div>

      {/* Row 3 — Two Panels (6 / 6 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAnomaliesFeed anomalies={anomalies} loading={anomalyLoading} />
        <BudgetStatusBar budgetStatus={budgetStatus} loading={budgetLoading} />
      </div>
    </div>
  );
}
