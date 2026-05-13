import { expoDb } from '../db';
import apiClient from '../api/client';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';

export type SyncResult = {
  pushed: number;
  conflicts: number;
  errors: string[];
  duration_ms: number;
};

// Push pending local records to server and mark them synced immediately
export async function runSync(
  injectedCases?: any[],
  injectedNotes?: any[]
): Promise<SyncResult> {
  const start = Date.now();
  const result: SyncResult = { pushed: 0, conflicts: 0, errors: [], duration_ms: 0 };

  const net = await NetInfo.fetch();
  if (!net.isConnected) throw new Error('No internet connection');

  try {
    expoDb.execSync(`PRAGMA wal_checkpoint(FULL)`);
    const pendingCases = injectedCases ?? expoDb.getAllSync<any>(`SELECT * FROM cases WHERE sync_status = 'pending'`);
    const pendingNotes = injectedNotes ?? expoDb.getAllSync<any>(`SELECT * FROM case_notes WHERE sync_status = 'pending'`);

    result.errors.push(`DEBUG: injected=${!!injectedCases} found=${pendingCases.length} cases`);

    if (pendingCases.length === 0 && pendingNotes.length === 0) {
      result.duration_ms = Date.now() - start;
      return result;
    }

    const payload = {
      cases: pendingCases.map((c) => ({ local_id: c.id, server_id: c.server_id, updated_at: c.updated_at, data: c })),
      notes: pendingNotes.map((n) => {
        const parentCase = expoDb.getFirstSync<any>(
          `SELECT server_id FROM cases WHERE id = ?`, [n.case_id]
        );
        return {
          local_id: n.id,
          server_id: n.server_id,
          updated_at: n.updated_at,
          data: { ...n, case_id: parentCase?.server_id ?? n.case_id },
        };
      }),
    };

    let created: any[] = [], updated: any[] = [], conflicts: any[] = [];
    try {
      const pushResponse = await apiClient.post('/sync/push/', payload, { timeout: 15000 });
      created = pushResponse.data.created ?? [];
      updated = pushResponse.data.updated ?? [];
      conflicts = pushResponse.data.conflicts ?? [];
    } catch (pushErr: any) {
      // Push timed out but case may have landed on server — pull to reconcile
      result.errors.push(`Push timeout, reconciling via pull...`);
      try {
        const lastSync = (await SecureStore.getItemAsync('last_sync_at')) ?? '1970-01-01T00:00:00Z';
        const pullResponse = await apiClient.get('/sync/pull/', { params: { last_sync: lastSync }, timeout: 20000 });
        const serverCases: any[] = pullResponse.data.cases ?? [];
        // Any pending case whose title matches a server case → mark synced
        for (const c of pendingCases) {
          const match = serverCases.find((sc: any) => sc.title === c.title && sc.description === c.description);
          if (match) created.push({ local_id: c.id, server_id: match.id });
        }
      } catch {
        throw pushErr;
      }
    }
    result.errors.push(`DEBUG: sent ${pendingCases.length} cases, server created=${created?.length ?? 0} updated=${updated?.length ?? 0}`);

    const serverIdMap: Record<string, string> = {};
    for (const item of [...(created ?? []), ...(updated ?? [])]) {
      if (item.local_id && item.server_id) serverIdMap[item.local_id] = item.server_id;
    }

    // DELETE + INSERT instead of UPDATE — bypasses expo-sqlite UPDATE persistence bug
    for (const c of pendingCases) {
      const serverId = serverIdMap[c.id] ?? c.server_id ?? null;
      expoDb.execSync(`DELETE FROM cases WHERE id = '${c.id}'`);
      expoDb.runSync(
        `INSERT INTO cases
          (id, server_id, org_id, title, description, type, priority, status,
           is_sensitive, location_lat, location_lng, ai_summary, ai_category,
           ai_priority, ai_urgency_score, ai_suggested_action,
           sync_status, created_by, created_at, updated_at, deleted_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)`,
        [
          c.id, serverId, c.org_id, c.title, c.description,
          c.type, c.priority, c.status ?? 'open', c.is_sensitive ? 1 : 0,
          c.location_lat ?? null, c.location_lng ?? null,
          c.ai_summary ?? null, c.ai_category ?? null, c.ai_priority ?? null,
          c.ai_urgency_score ?? null, c.ai_suggested_action ?? null,
          c.created_by, c.created_at, c.updated_at, c.deleted_at ?? null,
        ]
      );
    }

    for (const n of pendingNotes) {
      const serverId = serverIdMap[n.id] ?? n.server_id ?? null;
      expoDb.execSync(`DELETE FROM case_notes WHERE id = '${n.id}'`);
      expoDb.runSync(
        `INSERT INTO case_notes (id, server_id, case_id, author_id, body, sync_status, created_at, updated_at)
         VALUES (?,?,?,?,?,'synced',?,?)`,
        [n.id, serverId, n.case_id, n.author_id, n.body, n.created_at, n.updated_at]
      );
    }

    for (const conflict of conflicts ?? []) {
      expoDb.execSync(`DELETE FROM cases WHERE id = '${conflict.local_id}'`);
      const orig = pendingCases.find((c: any) => c.id === conflict.local_id);
      if (orig) {
        expoDb.runSync(
          `INSERT INTO cases
            (id, server_id, org_id, title, description, type, priority, status,
             is_sensitive, sync_status, created_by, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,'conflict',?,?,?,?)`,
          [orig.id, orig.server_id ?? null, orig.org_id, orig.title, orig.description,
           orig.type, orig.priority, orig.status ?? 'open', orig.is_sensitive ? 1 : 0,
           orig.created_by, orig.created_at, orig.updated_at]
        );
      }
    }

    result.pushed = (created?.length ?? 0) + (updated?.length ?? 0);
    result.conflicts = conflicts?.length ?? 0;

  } catch (err: any) {
    const detail = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message;
    result.errors.push(detail ?? 'Push failed');
  }

  result.duration_ms = Date.now() - start;

  expoDb.runSync(
    `INSERT INTO sync_log (id, synced_at, pushed_count, pulled_count, conflict_count, error, duration_ms)
     VALUES (?,?,?,0,?,?,?)`,
    [randomUUID(), new Date().toISOString(), result.pushed, result.conflicts,
     result.errors.join('; ') || null, result.duration_ms]
  );

  return result;
}

// Pull server changes silently in background — called after spinner is dismissed
export async function runPull(): Promise<void> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const storedSync = await SecureStore.getItemAsync('last_sync_at');
  const localCount = expoDb.getFirstSync<{ n: number }>(`SELECT COUNT(*) as n FROM cases WHERE deleted_at IS NULL`);
  const lastSync = (!storedSync || (localCount?.n ?? 0) === 0)
    ? '1970-01-01T00:00:00Z'
    : storedSync;
  const pullResponse = await apiClient.get('/sync/pull/', { params: { last_sync: lastSync }, timeout: 20000 });
  const { cases: serverCases, notes: serverNotes, alerts: serverAlerts, server_time } = pullResponse.data;

  for (const sc of serverCases ?? []) {
    const existing = expoDb.getFirstSync<{ id: string }>(
      `SELECT id FROM cases WHERE server_id = ?`, [sc.id]
    );

    // Match pending local case by created_at — fixes duplicate when push response was lost
    const pendingMatch = !existing ? expoDb.getFirstSync<{ id: string }>(
      `SELECT id FROM cases WHERE created_at = ? AND sync_status = 'pending' AND server_id IS NULL`,
      [sc.created_at]
    ) : null;

    try {
      if (pendingMatch) {
        expoDb.runSync(
          `UPDATE cases SET server_id = ?, sync_status = 'synced', updated_at = ?,
            created_by_name = ?, created_by_email = ? WHERE id = ?`,
          [sc.id, sc.updated_at, sc.created_by_name ?? null, sc.created_by_email ?? null, pendingMatch.id]
        );
      } else if (!existing) {
        // Try with new columns first, fall back to without them if columns don't exist yet
        try {
          expoDb.runSync(
            `INSERT OR IGNORE INTO cases
              (id, server_id, org_id, title, description, type, priority, status,
               is_sensitive, location_lat, location_lng, ai_summary, ai_category,
               ai_priority, ai_urgency_score, ai_suggested_action, sync_status,
               created_by, created_by_name, created_by_email, created_at, updated_at, deleted_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?,?,?)`,
            [
              randomUUID(), sc.id, sc.org_id ?? null, sc.title, sc.description,
              sc.type, sc.priority, sc.status ?? 'open', sc.is_sensitive ? 1 : 0,
              sc.location_lat ?? null, sc.location_lng ?? null,
              sc.ai_summary ?? null, sc.ai_category ?? null, sc.ai_priority ?? null,
              sc.ai_urgency_score ?? null, sc.ai_suggested_action ?? null,
              sc.created_by ?? null, sc.created_by_name ?? null, sc.created_by_email ?? null,
              sc.created_at, sc.updated_at, sc.deleted_at ?? null,
            ]
          );
        } catch {
          expoDb.runSync(
            `INSERT OR IGNORE INTO cases
              (id, server_id, org_id, title, description, type, priority, status,
               is_sensitive, location_lat, location_lng, ai_summary, ai_category,
               ai_priority, ai_urgency_score, ai_suggested_action, sync_status,
               created_by, created_at, updated_at, deleted_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)`,
            [
              randomUUID(), sc.id, sc.org_id ?? null, sc.title, sc.description,
              sc.type, sc.priority, sc.status ?? 'open', sc.is_sensitive ? 1 : 0,
              sc.location_lat ?? null, sc.location_lng ?? null,
              sc.ai_summary ?? null, sc.ai_category ?? null, sc.ai_priority ?? null,
              sc.ai_urgency_score ?? null, sc.ai_suggested_action ?? null,
              sc.created_by ?? null, sc.created_at, sc.updated_at, sc.deleted_at ?? null,
            ]
          );
        }
      } else {
        try {
          expoDb.runSync(
            `UPDATE cases SET title=?, description=?, type=?, priority=?, status=?,
               ai_summary=?, ai_category=?, ai_priority=?, ai_urgency_score=?,
               ai_suggested_action=?, updated_at=?, deleted_at=?,
               created_by_name=?, created_by_email=?, sync_status='synced'
             WHERE server_id=?`,
            [
              sc.title, sc.description, sc.type, sc.priority, sc.status ?? 'open',
              sc.ai_summary ?? null, sc.ai_category ?? null, sc.ai_priority ?? null,
              sc.ai_urgency_score ?? null, sc.ai_suggested_action ?? null,
              sc.updated_at, sc.deleted_at ?? null,
              sc.created_by_name ?? null, sc.created_by_email ?? null, sc.id,
            ]
          );
        } catch {
          expoDb.runSync(
            `UPDATE cases SET title=?, description=?, type=?, priority=?, status=?,
               ai_summary=?, ai_category=?, ai_priority=?, ai_urgency_score=?,
               ai_suggested_action=?, updated_at=?, deleted_at=?, sync_status='synced'
             WHERE server_id=?`,
            [
              sc.title, sc.description, sc.type, sc.priority, sc.status ?? 'open',
              sc.ai_summary ?? null, sc.ai_category ?? null, sc.ai_priority ?? null,
              sc.ai_urgency_score ?? null, sc.ai_suggested_action ?? null,
              sc.updated_at, sc.deleted_at ?? null, sc.id,
            ]
          );
        }
      }
    } catch { /* skip this case, continue with next */ }
  }

  for (const sn of serverNotes ?? []) {
    const existing = expoDb.getFirstSync<{ id: string }>(
      `SELECT id FROM case_notes WHERE server_id = ?`, [sn.id]
    );
    if (!existing) {
      expoDb.runSync(
        `INSERT OR IGNORE INTO case_notes (id, server_id, case_id, author_id, body, sync_status, created_at, updated_at)
         VALUES (?,?,?,?,?,'synced',?,?)`,
        [randomUUID(), sn.id, sn.case_id, sn.author_id ?? null, sn.body, sn.created_at, sn.updated_at]
      );
    } else {
      expoDb.runSync(
        `UPDATE case_notes SET body=?, updated_at=?, sync_status='synced' WHERE server_id=?`,
        [sn.body, sn.updated_at, sn.id]
      );
    }
  }

  for (const sa of serverAlerts ?? []) {
    const existing = expoDb.getFirstSync<{ id: string }>(
      `SELECT id FROM alerts WHERE server_id = ?`, [sa.id]
    );
    if (!existing) {
      expoDb.runSync(
        `INSERT OR IGNORE INTO alerts (id, server_id, type, message, sent_by, received_at, sync_status)
         VALUES (?,?,?,?,?,?,?)`,
        [randomUUID(), sa.id, sa.type, sa.message, sa.sent_by ?? null, sa.created_at ?? new Date().toISOString(), 'synced']
      );
    }
  }

  await SecureStore.setItemAsync('last_sync_at', server_time ?? new Date().toISOString());
}

export async function getPendingCount(): Promise<number> {
  const rows = expoDb.getAllSync<{ id: string }>(`SELECT id FROM cases WHERE sync_status = 'pending'`);
  return rows.length;
}
