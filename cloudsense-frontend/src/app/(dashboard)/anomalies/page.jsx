'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
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
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No AWS Account Connected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connect your AWS account via STS AssumeRole to initiate automated cost anomaly scans.
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning AWS account...</span>
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
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs flex items-center gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
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

      {/* Anomaly Cards List */}
      {loading && anomalies.length === 0 ? (
        <LoadingSpinner size="lg" text="Scanning telemetry for anomalies..." className="py-16" />
      ) : anomalies.length === 0 ? (
        <EmptyState
          title="No anomalies found for selected filters"
          subtitle="Your cloud infrastructure is within expected bounds or all current findings have been marked resolved."
        />
      ) : (
        <div className="space-y-4">
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

      {/* Slide-out details modal */}
      <AnomalyDetailModal
        open={Boolean(activeAnomalyModal)}
        anomaly={activeAnomalyModal}
        onClose={() => setActiveAnomalyModal(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
