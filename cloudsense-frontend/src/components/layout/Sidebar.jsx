'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  AlertTriangle,
  Bell,
  Cloud,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { activeConnection } = useAppStore();

  const [openAnomalyCount, setOpenAnomalyCount] = useState(0);
  const [unackAlertCount, setUnackAlertCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchBadgeCounts() {
      try {
        const [anomaliesRes, alertsRes] = await Promise.all([
          api.get('/anomalies', { params: { status: 'open' } }).catch(() => null),
          api.get('/alerts').catch(() => null),
        ]);
        if (isMounted) {
          if (anomaliesRes?.success && Array.isArray(anomaliesRes.data)) {
            const highSev = anomaliesRes.data.filter(
              (a) => a.severity === 'critical' || a.severity === 'high'
            );
            setOpenAnomalyCount(highSev.length);
          }
          if (alertsRes?.success && Array.isArray(alertsRes.data)) {
            const unack = alertsRes.data.filter((a) => a.status === 'sent');
            setUnackAlertCount(unack.length);
          }
        }
      } catch (err) {
        // silent fail on badge refresh
      }
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Usage', href: '/usage', icon: BarChart3 },
    { label: 'Budgets', href: '/budgets', icon: Target },
    {
      label: 'Anomalies',
      href: '/anomalies',
      icon: AlertTriangle,
      badge: openAnomalyCount > 0 ? openAnomalyCount : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: Bell,
      badge: unackAlertCount > 0 ? unackAlertCount : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
  ];

  const isConnected = activeConnection && activeConnection.connectionStatus === 'connected';

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-40 bg-[#0d0d0d] border-r border-[#222222] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#222222]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600/20 group-hover:border-blue-500/40 transition-all">
            <Cloud className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center">
            Cloud<span className="text-blue-500">Sense</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-blue-500' : 'text-zinc-400 group-hover:text-zinc-200'
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-5 text-center',
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* AWS Connection Indicator */}
      <div className="px-3 py-3 border-t border-[#222222]">
        <Link
          href="/connect"
          className="flex items-center justify-between p-2.5 rounded-lg border border-[#222222] bg-zinc-900/50 hover:bg-zinc-900 transition-colors group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0 animate-pulse',
                isConnected ? 'bg-green-500' : 'bg-amber-500'
              )}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {isConnected ? 'AWS Connected' : 'Connect AWS'}
              </p>
              {activeConnection?.accountId && (
                <p className="text-[11px] font-mono text-zinc-400 truncate">
                  acc: {activeConnection.accountId}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
        </Link>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#222222] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xs font-semibold text-zinc-200 uppercase shrink-0">
            {user?.name ? user.name.slice(0, 2) : 'CS'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-zinc-400 truncate">{user?.email || '—'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
