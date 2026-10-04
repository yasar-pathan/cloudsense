'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import AnomalyCard from '../../../components/anomalies/AnomalyCard';
import AnomalySeverityFilter from '../../../components/anomalies/AnomalySeverityFilter';
import AnomalyDetailModal from '../../../components/anomalies/AnomalyDetailModal';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import { useAppStore } from '../../../store/useAppStore';
import { useAnomalies } from '../../../hooks/useAnomalies';

export default function AnomaliesPage() {
  const { activeConnection } = useAppStore();
  const {
    anomalies,
    getAnomalies,
    runScan,
    updateAnomalyStatus,
    loading,
    scanning,
    error,
  } = useAnomalies();

  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [activeAnomalyModal, setActiveAnomalyModal] = useState(null);
  const [scanResultToast, setScanResultToast] = useState(null);

  const loadAnomalies = async () => {
    if (!activeConnection?._id) return;
    const filters = { connectionId: activeConnection._id };
    if (selectedSeverity) filters.severity = selectedSeverity;
    if (selectedStatus) filters.status = selectedStatus;
    await getAnomalies(filters);
  };

  useEffect(() => {
    loadAnomalies();
  }, [activeConnection?._id, selectedSeverity, selectedStatus]);

  const handleRunScan = async () => {
    if (!activeConnection?._id) return;
    setScanResultToast(null);
    const result = await runScan(activeConnection._id);
    if (result?.success) {
      setScanResultToast(`Scan complete: ${result.count} anomaly findings identified`);
      setTimeout(() => setScanResultToast(null), 4000);
      await loadAnomalies();
    }
  };

  const handleStatusChange = async (id, status) => {
    await updateAnomalyStatus(id, status);
  };

  if (!activeConnection) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100">No AWS Account Connected</h3>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Connect your AWS account via STS AssumeRole to initiate automated cost anomaly scans.
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

  // Count severities across loaded anomalies
  const severityCounts = {
    critical: anomalies.filter((a) => a.severity === 'critical').length,
    high: anomalies.filter((a) => a.severity === 'high').length,
    medium: anomalies.filter((a) => a.severity === 'medium').length,
    low: anomalies.filter((a) => a.severity === 'low').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Anomaly Detection"
        subtitle="10 AI-powered heuristic detectors analyzing AWS resource provisioning and usage patterns"
        actions={
          <button
            type="button"
            disabled={scanning}
            onClick={handleRunScan}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning your AWS account...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Scan Now</span>
              </>
            )}
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadAnomalies} />}

      {scanResultToast && (
        <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{scanResultToast}</span>
        </div>
      )}

      {/* Filter and Severity Bar */}
      <AnomalySeverityFilter
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        severityCounts={severityCounts}
      />

      {/* Anomalies List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Analyzing anomaly patterns..." className="py-16" />
      ) : anomalies.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No open anomalies detected"
          subtitle="Your AWS account looks healthy. None of the 10 cost leak patterns were triggered."
          action={
            <button
              type="button"
              disabled={scanning}
              onClick={handleRunScan}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run a new scan</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {anomalies.map((item) => (
            <AnomalyCard
              key={item._id}
              anomaly={item}
              onStatusChange={handleStatusChange}
              onViewDetails={(a) => setActiveAnomalyModal(a)}
            />
          ))}
        </div>
      )}

      {/* Slide-over Detail Modal */}
      <AnomalyDetailModal
        anomaly={activeAnomalyModal}
        open={Boolean(activeAnomalyModal)}
        onClose={() => setActiveAnomalyModal(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
