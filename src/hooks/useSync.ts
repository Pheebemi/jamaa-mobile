import { useState } from 'react';
import { useSyncStore } from '../sync/useSyncStore';
import { runSync, runPull, getPendingCount } from '../sync/syncEngine';
import { useNetworkStatus } from './useNetworkStatus';
import { Toast } from '../components/Toast';
import { expoDb } from '../db';

export function useSync() {
  const { isSyncing, setSyncing, setLastResult, setPendingCount, setLastSyncAt } = useSyncStore();
  const [isPulling, setIsPulling] = useState(false);
  const isOnline = useNetworkStatus();

  async function triggerPush() {
    if (isSyncing || isPulling) return;
    if (!isOnline) {
      Toast.show({ type: 'error', text1: 'No internet', text2: 'Connect first.' });
      return;
    }

    const pendingCases = expoDb.getAllSync<any>(`SELECT * FROM cases WHERE sync_status = 'pending'`);
    const pendingNotes = expoDb.getAllSync<any>(`SELECT * FROM case_notes WHERE sync_status = 'pending'`);

    if (pendingCases.length === 0 && pendingNotes.length === 0) {
      Toast.show({ type: 'info', text1: 'All caught up', text2: 'No new cases to upload.' });
      return;
    }

    setSyncing(true);
    try {
      const result = await runSync(pendingCases, pendingNotes);
      setLastResult(result);
      const remaining = await getPendingCount();
      setPendingCount(remaining);

      const hasRealError = result.errors.some(e => !e.startsWith('DEBUG') && !e.startsWith('Push timeout'));

      if (hasRealError) {
        Toast.show({
          type: 'error',
          text1: 'Upload failed',
          text2: 'Please check your connection and try again.',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: `↑ ${result.pushed} case${result.pushed !== 1 ? 's' : ''} uploaded`,
          text2: 'Refreshing your cases in a moment…',
        });

        // Pull silently after 5 seconds — no spinner, no toast
        setTimeout(async () => {
          try {
            await runPull();
            setLastSyncAt(new Date().toISOString());
          } catch {}
        }, 5000);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: 'Please check your connection and try again.',
      });
    } finally {
      setSyncing(false);
    }
  }

  async function triggerPull() {
    if (isSyncing || isPulling) return;
    if (!isOnline) {
      Toast.show({ type: 'error', text1: 'No internet', text2: 'Connect first.' });
      return;
    }
    setIsPulling(true);
    try {
      await runPull();
      setLastSyncAt(new Date().toISOString());
      Toast.show({ type: 'success', text1: '↓ Cases refreshed', text2: 'You have the latest data.' });
    } catch {
      Toast.show({ type: 'error', text1: 'Refresh failed', text2: 'Please try again.' });
    } finally {
      setIsPulling(false);
    }
  }

  return {
    triggerPush,
    triggerPull,
    isSyncing,
    isPulling,
    isOnline,
    pendingCount: useSyncStore((s) => s.pendingCount),
  };
}
