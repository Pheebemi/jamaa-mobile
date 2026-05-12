// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo
// SQL is inlined as strings to avoid Metro bundler issues with .sql file imports.

import journal from './meta/_journal.json';

const m0000 = `
CREATE TABLE \`alerts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`server_id\` text,
	\`type\` text NOT NULL,
	\`message\` text NOT NULL,
	\`sent_by\` text,
	\`received_at\` text NOT NULL,
	\`read_at\` text,
	\`sync_status\` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`attachments\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`server_id\` text,
	\`case_id\` text NOT NULL,
	\`local_uri\` text,
	\`remote_url\` text,
	\`file_type\` text,
	\`sync_status\` text DEFAULT 'pending' NOT NULL,
	\`uploaded_by\` text NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`case_notes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`server_id\` text,
	\`case_id\` text NOT NULL,
	\`author_id\` text NOT NULL,
	\`body\` text NOT NULL,
	\`sync_status\` text DEFAULT 'pending' NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL,
	\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`cases\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`server_id\` text,
	\`org_id\` text NOT NULL,
	\`title\` text NOT NULL,
	\`description\` text NOT NULL,
	\`type\` text NOT NULL,
	\`priority\` text NOT NULL,
	\`status\` text DEFAULT 'open' NOT NULL,
	\`assigned_to\` text,
	\`is_sensitive\` integer DEFAULT false,
	\`location_lat\` real,
	\`location_lng\` real,
	\`ai_summary\` text,
	\`ai_category\` text,
	\`ai_priority\` text,
	\`ai_urgency_score\` integer,
	\`ai_suggested_action\` text,
	\`sync_status\` text DEFAULT 'pending' NOT NULL,
	\`created_by\` text NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL,
	\`deleted_at\` text
);
--> statement-breakpoint
CREATE TABLE \`sync_log\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`synced_at\` text NOT NULL,
	\`pushed_count\` integer DEFAULT 0,
	\`pulled_count\` integer DEFAULT 0,
	\`conflict_count\` integer DEFAULT 0,
	\`error\` text,
	\`duration_ms\` integer
);
--> statement-breakpoint
CREATE TABLE \`users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`server_id\` text,
	\`email\` text NOT NULL,
	\`name\` text NOT NULL,
	\`role\` text NOT NULL,
	\`org_id\` text,
	\`access_token\` text,
	\`refresh_token\` text,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);
`;

export default {
  journal,
  migrations: {
    m0000,
  },
};
