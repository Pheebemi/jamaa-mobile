import { expoDb } from '../db';

export type ConflictChoice = 'keep_local' | 'use_server';

export async function resolveConflict(
  localRecord: any,
  serverRecord: any,
  choice: ConflictChoice
) {
  if (choice === 'use_server') {
    expoDb.runSync(
      `UPDATE cases SET title=?, description=?, type=?, priority=?, status=?, sync_status='synced'
       WHERE id=?`,
      [serverRecord.title, serverRecord.description, serverRecord.type,
       serverRecord.priority, serverRecord.status, localRecord.id]
    );
  } else {
    expoDb.runSync(
      `UPDATE cases SET sync_status='pending', updated_at=? WHERE id=?`,
      [new Date().toISOString(), localRecord.id]
    );
  }
}
