'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, RefreshCw, Trash2, ArrowRight, Shield } from 'lucide-react';
import api from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { formatDateTime } from '../../lib/utils';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function ConnectionStatusCard({ connection, onRefresh }) {
  const router = useRouter();
  const { setActiveConnection } = useAppStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = connection.connectionStatus === 'connected';

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/aws/connections/${connection._id}/test`);
      if (res.success) {
        setTestResult({ success: true, message: 'Role assumed successfully. AWS connection valid.' });
      } else {
        setTestResult({ success: false, message: res.message || 'Connection failed' });
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await api.delete(`/aws/connections/${connection._id}`);
      if (res.success) {
        setActiveConnection(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                AWS Account {connection.accountId || 'Connected'}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  isConnected
                    ? 'border-green-500/30 bg-green-950/40 text-green-400'
                    : 'border-red-500/30 bg-red-950/40 text-red-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                {isConnected ? 'Connected' : 'Connection Error'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate max-w-md">
              Role: {connection.roleArn}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg border border-[#222222] bg-[#1a1a1a]/50">
          <p className="text-xs text-zinc-400">AWS Region</p>
          <p className="text-sm font-semibold text-zinc-200 mt-1 font-mono">
            {connection.region || 'us-east-1'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-[#222222] bg-[#1a1a1a]/50">
          <p className="text-xs text-zinc-400">Last Synced</p>
          <p className="text-sm font-semibold text-zinc-200 mt-1">
            {connection.lastSyncedAt ? formatDateTime(connection.lastSyncedAt) : 'Never'}
          </p>
        </div>

        <div className="p-3 rounded-lg border border-[#222222] bg-[#1a1a1a]/50">
          <p className="text-xs text-zinc-400">External ID</p>
          <p className="text-sm font-semibold text-zinc-200 mt-1 font-mono truncate">
            {connection.externalId}
          </p>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            testResult.success
              ? 'border-green-500/30 bg-green-950/30 text-green-300'
              : 'border-red-500/30 bg-red-950/30 text-red-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={testing}
          onClick={handleTestConnection}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#222222] bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{testing ? 'Testing AssumeRole...' : 'Test Connection'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDisconnectModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Disconnect Account</span>
        </button>
      </div>

      <ConfirmDialog
        open={showDisconnectModal}
        title="Disconnect AWS Account"
        message="Are you sure you want to disconnect this AWS account? Monitoring and anomaly detection jobs will pause for this account."
        confirmText="Disconnect"
        variant="danger"
        loading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectModal(false)}
      />
    </div>
  );
}
