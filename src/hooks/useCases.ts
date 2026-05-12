import { useEffect, useState } from 'react';
import { expoDb } from '../db';
import { useSyncStore } from '../sync/useSyncStore';

export function useCases() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastSyncAt } = useSyncStore();

  useEffect(() => {
    try {
      const rows = expoDb.getAllSync<any>(
        `SELECT * FROM cases WHERE deleted_at IS NULL ORDER BY created_at DESC`
      );
      setData(rows);
    } finally {
      setLoading(false);
    }
  }, [lastSyncAt]);

  return { data, loading };
}
