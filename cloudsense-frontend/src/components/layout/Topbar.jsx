'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  RefreshCw,
  Download,
  Scan,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

export default function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeConnection, lastSyncedAt, setLastSyncedAt } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard') || path === '/') return 'Overview';
    if (path.startsWith('/usage')) return 'Usage';
    if (path.startsWith('/budgets')) return 'Budgets';
    if (path.startsWith('/anomalies')) return 'Anomalies';
    if (path.startsWith('/alerts')) return 'Alerts';
    if (path.startsWith('/connect')) return 'AWS Connection';
    return 'Overview';
  };

  const handleSyncNow = async () => {
    if (!activeConnection?._id) return;
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await api.post('/usage/sync', { connectionId: activeConnection._id });
      if (res.success) {
        setLastSyncedAt(new Date());
        setStatusMessage('Synced');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleRunScan = async () => {
    if (!activeConnection?._id) return;
    setScanning(true);
    try {
      await api.post('/anomalies/scan', { connectionId: activeConnection._id });
      setStatusMessage('Scan complete');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 md:px-8">
      {/* Left: Tab Title & Status Badges */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {getPageTitle(pathname)}
        </h2>

        {/* Synced status badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-normal">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Synced 4 min ago</span>
        </div>

        {/* Budget Warning Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>EC2 budget exceeded</span>
        </div>
      </div>

      {/* Right Controls: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Sync Button */}
        <button
          type="button"
          disabled={syncing}
          onClick={handleSyncNow}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-all disabled:opacity-50'
          )}
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5 text-slate-500',
              syncing && 'animate-spin text-blue-600'
            )}
          />
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>

        {/* Run Scan Button */}
        <button
          type="button"
          disabled={scanning}
          onClick={handleRunScan}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-all disabled:opacity-50"
        >
          <Scan
            className={cn(
              'w-3.5 h-3.5 text-slate-500',
              scanning && 'animate-spin text-blue-600'
            )}
          />
          <span>{scanning ? 'Scanning...' : 'Run scan'}</span>
        </button>
      </div>
    </header>
  );
}
