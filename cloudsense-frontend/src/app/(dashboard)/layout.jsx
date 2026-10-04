'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import MobileNav from '../../components/layout/MobileNav';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import api from '../../lib/api';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, getMe } = useAuth();
  const { activeConnection, setActiveConnection, setConnections } = useAppStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        await getMe();
        // Fetch active connection if needed
        if (!activeConnection) {
          const res = await api.get('/aws/connections');
          if (isMounted && res.success && Array.isArray(res.data)) {
            setConnections(res.data);
            const active =
              res.data.find((c) => c.connectionStatus === 'connected') || res.data[0];
            if (active) setActiveConnection(active);
          }
        }
      } catch (err) {
        console.error('Failed to initialize dashboard session:', err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating CloudSense session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Fixed Sidebar for desktop */}
      <Sidebar />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Fixed Bottom Nav for mobile */}
      <MobileNav />
    </div>
  );
}
