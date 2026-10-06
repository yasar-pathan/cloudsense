'use client';

import React, { useEffect, useState } from 'react';
import ConnectionStepWizard from '../../../components/connect/ConnectionStepWizard';
import ConnectionStatusCard from '../../../components/connect/ConnectionStatusCard';
import PageHeader from '../../../components/ui/PageHeader';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import api from '../../../lib/api';
import { useAppStore } from '../../../store/useAppStore';

export default function ConnectPage() {
  const { activeConnection, setActiveConnection, setConnections } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const fetchConnections = async () => {
    try {
      const res = await api.get('/aws/connections');
      if (res.success && Array.isArray(res.data)) {
        setConnections(res.data);
        const active = res.data.find((c) => c.connectionStatus === 'connected') || res.data[0];
        if (active) {
          setActiveConnection(active);
        }
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading connection details..." className="py-20" />;
  }

  const isConnected = activeConnection && activeConnection.isActive;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="AWS Connection Setup"
        subtitle="Manage secure cross-account STS AssumeRole access to your AWS cloud resources"
        actions={
          isConnected && !showWizard ? (
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
            >
              + Connect Another Account
            </button>
          ) : null
        }
      />

      {isConnected && !showWizard ? (
        <ConnectionStatusCard connection={activeConnection} onRefresh={fetchConnections} />
      ) : (
        <ConnectionStepWizard
          onConnected={(conn) => {
            setShowWizard(false);
            fetchConnections();
          }}
        />
      )}
    </div>
  );
}
