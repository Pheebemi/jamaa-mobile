import { useState } from 'react';
import { useSyncStore } from '../sync/useSyncStore';
import { runSync, runPull, getPendingCount } from '../sync/syncEngine';
import { useNetworkStatus } from './useNetworkStatus';
import { Toast } from '../components/Toast';

export function useSync() {
  const { isSyncing, setSyncing, setLastResult, setPendingCount } = useSyncStore();
  const [isPulling, setIsPulling] = useState(false);
  const isOnline = useNetworkStatus();

  async function triggerPush() {
    if (isSyncing || isPulling) return;
    if (!isOnline) {
      Toast.show({ type: 'error', text1: 'No internet', text2: 'Connect first.' });
      return;
    }
    setSyncing(true);
    try {
      const result = await runSync();
      setLastResult(result);
      const remaining = await getPendingCount();
      setPendingCount(remaining);

      if (result.errors.length > 0) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: result.errors[0] });
      } else if (result.pushed === 0) {
        Toast.show({ type: 'info', text1: 'Nothing to upload', text2: 'No pending cases.' });
      } else {
        Toast.show({ type: 'success', text1: `↑ Uploaded ${result.pushed} case${result.pushed !== 1 ? 's' : ''}`, text2: 'Saved to server successfully.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: err.message });
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
      Toast.show({ type: 'success', text1: '↓ Download complete', text2: 'Latest data pulled from server.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Download failed', text2: err.message });
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
