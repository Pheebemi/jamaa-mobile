import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  org_id: text('org_id'),
  access_token: text('access_token'),
  refresh_token: text('refresh_token'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  org_id: text('org_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull().default('open'),
  assigned_to: text('assigned_to'),
  is_sensitive: integer('is_sensitive', { mode: 'boolean' }).default(false),
  location_lat: real('location_lat'),
  location_lng: real('location_lng'),
  ai_summary: text('ai_summary'),
  ai_category: text('ai_category'),
  ai_priority: text('ai_priority'),
  ai_urgency_score: integer('ai_urgency_score'),
  ai_suggested_action: text('ai_suggested_action'),
  sync_status: text('sync_status').notNull().default('pending'),
  created_by: text('created_by').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const case_notes = sqliteTable('case_notes', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  case_id: text('case_id').notNull(),
  author_id: text('author_id').notNull(),
  body: text('body').notNull(),
  sync_status: text('sync_status').notNull().default('pending'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  case_id: text('case_id').notNull(),
  local_uri: text('local_uri'),
  remote_url: text('remote_url'),
  file_type: text('file_type'),
  sync_status: text('sync_status').notNull().default('pending'),
  uploaded_by: text('uploaded_by').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const sync_log = sqliteTable('sync_log', {
  id: text('id').primaryKey(),
  synced_at: text('synced_at').notNull(),
  pushed_count: integer('pushed_count').default(0),
  pulled_count: integer('pulled_count').default(0),
  conflict_count: integer('conflict_count').default(0),
  error: text('error'),
  duration_ms: integer('duration_ms'),
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  server_id: text('server_id'),
  type: text('type').notNull(),
  message: text('message').notNull(),
  sent_by: text('sent_by'),
  received_at: text('received_at').notNull(),
  read_at: text('read_at'),
  sync_status: text('sync_status').notNull().default('pending'),
});

export type User = typeof users.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseNote = typeof case_notes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type SyncLog = typeof sync_log.$inferSelect;
export type Alert = typeof alerts.$inferSelect;

export type NewCase = typeof cases.$inferInsert;
export type NewCaseNote = typeof case_notes.$inferInsert;
