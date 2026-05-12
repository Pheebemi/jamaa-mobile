import { create } from 'zustand';
import { expoDb } from '../db';
import { randomUUID } from 'expo-crypto';

interface NewCaseInput {
  title: string;
  description: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  is_sensitive?: boolean;
  location_lat?: number;
  location_lng?: number;
  assigned_to?: string;
}

interface CaseStore {
  createCase: (input: NewCaseInput, userId: string, orgId: string) => Promise<string>;
  updateCase: (id: string, updates: Partial<NewCaseInput>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addNote: (caseId: string, body: string, authorId: string) => Promise<void>;
}

export const useCaseStore = create<CaseStore>(() => ({
  createCase: async (input, userId, orgId) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO cases (id, org_id, created_by, title, description, type, priority,
        is_sensitive, location_lat, location_lng, status, sync_status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'open','pending',?,?)`,
      [
        id, orgId, userId, input.title, input.description, input.type, input.priority,
        input.is_sensitive ? 1 : 0,
        input.location_lat ?? null, input.location_lng ?? null,
        now, now,
      ]
    );
    return id;
  },

  updateCase: async (id, updates) => {
    const now = new Date().toISOString();
    const fields = Object.entries(updates)
      .map(([k]) => `${k} = ?`)
      .join(', ');
    const values = Object.values(updates);
    expoDb.runSync(
      `UPDATE cases SET ${fields}, sync_status = 'pending', updated_at = ? WHERE id = ?`,
      [...values, now, id]
    );
  },

  deleteCase: async (id) => {
    expoDb.runSync(
      `UPDATE cases SET deleted_at = ?, sync_status = 'pending' WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  },

  addNote: async (caseId, body, authorId) => {
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO case_notes (id, case_id, author_id, body, sync_status, created_at, updated_at)
       VALUES (?,?,?,?,'pending',?,?)`,
      [randomUUID(), caseId, authorId, body, now, now]
    );
  },
}));
