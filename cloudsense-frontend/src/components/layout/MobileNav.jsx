'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Usage', href: '/usage', icon: BarChart3 },
    { label: 'Budgets', href: '/budgets', icon: Target },
    { label: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
    { label: 'Alerts', href: '/alerts', icon: Bell },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d] border-t border-[#222222] px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors',
              isActive ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
