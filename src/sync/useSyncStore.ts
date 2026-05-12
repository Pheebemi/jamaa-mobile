import { create } from 'zustand';
import type { SyncResult } from './syncEngine';

interface SyncStore {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  lastResult: SyncResult | null;
  setSyncing: (v: boolean) => void;
  setLastResult: (r: SyncResult) => void;
  setPendingCount: (n: number) => void;
  setLastSyncAt: (t: string) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  lastResult: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastResult: (lastResult) => set({ lastResult, lastSyncAt: new Date().toISOString() }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
}));
