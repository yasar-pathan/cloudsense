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
  Zap,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { activeConnection } = useAppStore();

  const [openAnomalyCount, setOpenAnomalyCount] = useState(3);
  const [unackAlertCount, setUnackAlertCount] = useState(1);

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
            setOpenAnomalyCount(anomaliesRes.data.length || 0);
          }
          if (alertsRes?.success && Array.isArray(alertsRes.data)) {
            const unack = alertsRes.data.filter((a) => a.status === 'sent');
            setUnackAlertCount(unack.length || 0);
          }
        }
      } catch (err) {
        // silent fail
      }
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const sections = [
    {
      title: 'MONITOR',
      items: [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Usage', href: '/usage', icon: BarChart3 },
        { label: 'Budgets', href: '/budgets', icon: Target },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          label: 'Anomalies',
          href: '/anomalies',
          icon: AlertTriangle,
          badge: openAnomalyCount > 0 ? openAnomalyCount : null,
          badgeColor: 'bg-red-50 text-red-600 border border-red-200',
        },
        {
          label: 'Alerts',
          href: '/alerts',
          icon: Bell,
          badge: unackAlertCount > 0 ? unackAlertCount : null,
          badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
        },
      ],
    },
    {
      title: 'SETUP',
      items: [
        { label: 'AWS connection', href: '/connect', icon: Zap },
        { label: 'Settings', href: '/connect', icon: Settings },
      ],
    },
  ];

  const isConnected = activeConnection && activeConnection.connectionStatus === 'connected';
  const accountIdSnippet = activeConnection?.accountId
    ? `..${activeConnection.accountId.slice(-4)}`
    : '..7261';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'YP';

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-40 bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Cloud className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            CloudSense
          </span>
        </Link>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
          prod
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    item.href !== '/connect' &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive
                            ? 'text-blue-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-full min-w-5 text-center',
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AWS Connection Indicator Box */}
      <div className="px-3 pb-3">
        <Link
          href="/connect"
          className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-emerald-800">
              {isConnected ? 'Connected' : 'Connected'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700">
            {accountIdSnippet}
          </span>
        </Link>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 uppercase shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.name || 'Yasar Pathan'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || 'yasar@cloudsense.io'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
