'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw, Cloud, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { formatDateTime, cn } from '../../lib/utils';

export default function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeConnection, lastSyncedAt, setLastSyncedAt } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Overview';
    if (path.startsWith('/usage')) return 'Service Usage';
    if (path.startsWith('/budgets')) return 'Budgets & Thresholds';
    if (path.startsWith('/anomalies')) return 'Cost Anomalies';
    if (path.startsWith('/alerts')) return 'Alert Notifications';
    if (path.startsWith('/connect')) return 'AWS Connection Setup';
    return 'Dashboard';
  };

  const handleSyncNow = async () => {
    if (!activeConnection?._id) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.post('/usage/sync', { connectionId: activeConnection._id });
      if (res.success) {
        const now = new Date();
        setLastSyncedAt(now);
        setSyncMessage('Synced');
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = activeConnection && activeConnection.connectionStatus === 'connected';

  return (
    <header className="h-16 border-b border-[#222222] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">{getPageTitle(pathname)}</h2>
      </div>

      {/* Center - AWS Connection Chip */}
      <div className="hidden sm:flex items-center">
        {isConnected ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20 bg-green-950/40 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>AWS Connected</span>
            {activeConnection.accountId && (
              <span className="font-mono text-zinc-400">({activeConnection.accountId})</span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20 bg-amber-950/40 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>No AWS Account Connected</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync Status & Button */}
        {isConnected && (
          <div className="flex items-center gap-2">
            {lastSyncedAt && (
              <span className="hidden lg:inline text-xs text-zinc-400">
                Synced {formatDateTime(lastSyncedAt)}
              </span>
            )}
            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncNow}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222222] bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50'
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-zinc-400', syncing && 'animate-spin text-blue-400')} />
              <span>{syncing ? 'Syncing...' : syncMessage || 'Sync Now'}</span>
            </button>
          </div>
        )}

        {/* User initials & logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#222222]">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold uppercase">
            {user?.name ? user.name.slice(0, 2) : 'CS'}
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            aria-label="Log out"
            className="hidden md:inline-flex p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
