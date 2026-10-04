import { create } from 'zustand';
import { clearAuth, setToken, setUser, getToken, getUser } from '../lib/auth';

export const useAppStore = create((set) => ({
  user: typeof window !== 'undefined' ? getUser() : null,
  token: typeof window !== 'undefined' ? getToken() : null,
  activeConnection: null,
  connections: [],
  lastSyncedAt: null,

  setUser: (user) => {
    setUser(user);
    set({ user });
  },

  setToken: (token) => {
    setToken(token);
    set({ token });
  },

  setActiveConnection: (activeConnection) => {
    set({
      activeConnection,
      lastSyncedAt: activeConnection?.lastSyncedAt || null,
    });
  },

  setConnections: (connections) => {
    set((state) => {
      const active =
        state.activeConnection ||
        connections.find((c) => c.connectionStatus === 'connected') ||
        connections[0] ||
        null;
      return {
        connections,
        activeConnection: active,
        lastSyncedAt: active?.lastSyncedAt || state.lastSyncedAt,
      };
    });
  },

  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),

  clearAuth: () => {
    clearAuth();
    set({
      user: null,
      token: null,
      activeConnection: null,
      connections: [],
      lastSyncedAt: null,
    });
  },
}));
