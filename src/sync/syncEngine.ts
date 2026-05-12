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
export async function runSync(): Promise<SyncResult> {
  const start = Date.now();
  const result: SyncResult = { pushed: 0, conflicts: 0, errors: [], duration_ms: 0 };

  const net = await NetInfo.fetch();
  if (!net.isConnected) throw new Error('No internet connection');

  try {
    const pendingCases = expoDb.getAllSync<any>(`SELECT * FROM cases WHERE sync_status = 'pending'`);
    const pendingNotes = expoDb.getAllSync<any>(`SELECT * FROM case_notes WHERE sync_status = 'pending'`);

    if (pendingCases.length === 0 && pendingNotes.length === 0) {
      result.errors.push(`DEBUG: raw SQL found 0 pending cases`);
      result.duration_ms = Date.now() - start;
      return result;
    }

    const payload = {
      cases: pendingCases.map((c) => ({ local_id: c.id, server_id: c.server_id, updated_at: c.updated_at, data: c })),
      notes: pendingNotes.map((n) => ({ local_id: n.id, server_id: n.server_id, updated_at: n.updated_at, data: n })),
    };

    const pushResponse = await apiClient.post('/sync/push/', payload);
    const { created, updated, conflicts } = pushResponse.data;
    result.errors.push(`DEBUG: sent ${pendingCases.length} cases, server created=${created?.length ?? 0} updated=${updated?.length ?? 0}`);

    const serverIdMap: Record<string, string> = {};
    for (const item of [...(created ?? []), ...(updated ?? [])]) {
      if (item.local_id && item.server_id) serverIdMap[item.local_id] = item.server_id;
    }

    for (const c of pendingCases) {
      const serverId = serverIdMap[c.id] ?? c.server_id ?? '';
      const sid = serverId ? `'${serverId}'` : 'NULL';
      expoDb.execSync(`UPDATE cases SET sync_status = 'synced', server_id = ${sid} WHERE id = '${c.id}'`);
      const check = expoDb.getFirstSync<any>(`SELECT sync_status FROM cases WHERE id = '${c.id}'`);
      result.errors.push(`DEBUG after update: case ${c.id.slice(0,8)} status=${check?.sync_status}`);
    }
    for (const n of pendingNotes) {
      const serverId = serverIdMap[n.id] ?? n.server_id ?? '';
      const sid = serverId ? `'${serverId}'` : 'NULL';
      expoDb.execSync(`UPDATE case_notes SET sync_status = 'synced', server_id = ${sid} WHERE id = '${n.id}'`);
    }
    for (const conflict of conflicts ?? []) {
      expoDb.execSync(`UPDATE cases SET sync_status = 'conflict' WHERE id = '${conflict.local_id}'`);
    }

    result.pushed = (created?.length ?? 0) + (updated?.length ?? 0);
    result.conflicts = conflicts?.length ?? 0;

  } catch (err: any) {
    result.errors.push(err.message ?? 'Push failed');
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

  const lastSync = (await SecureStore.getItemAsync('last_sync_at')) ?? '1970-01-01T00:00:00Z';
  const pullResponse = await apiClient.get('/sync/pull/', { params: { last_sync: lastSync }, timeout: 20000 });
  const { cases: serverCases, notes: serverNotes, alerts: serverAlerts, server_time } = pullResponse.data;

  for (const sc of serverCases ?? []) {
    const existing = expoDb.getFirstSync<{ id: string }>(
      `SELECT id FROM cases WHERE server_id = ?`, [sc.id]
    );
    if (!existing) {
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
    } else {
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
