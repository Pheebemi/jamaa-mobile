import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSyncStore } from '../sync/useSyncStore';
import { expoDb } from '../db';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const setPendingCount = useSyncStore((s) => s.setPendingCount);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    const updatePending = () => {
      try {
        const rows = expoDb.getAllSync<{ id: string }>(`SELECT id FROM cases WHERE sync_status = 'pending'`);
        setPendingCount(rows.length);
      } catch {}
    };

    updatePending();
    const interval = setInterval(updatePending, 30_000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
