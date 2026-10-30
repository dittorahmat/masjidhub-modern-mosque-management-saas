CREATE TABLE `ai_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`sender_role` text NOT NULL,
	`text` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`metadata` text,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`category` text DEFAULT 'umum' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_room_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`message` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`read_by` text,
	FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`participants` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_message_at` integer,
	`last_message` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text,
	`is_anonymous` integer DEFAULT true NOT NULL,
	`session_salt` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_activity_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`event_id` text NOT NULL,
	`attendee_name` text NOT NULL,
	`attendee_phone` text,
	`attendee_email` text,
	`name` text,
	`email` text,
	`phone` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`checked_in_at` integer,
	`registered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`speaker` text,
	`date` integer NOT NULL,
	`time` text,
	`location` text NOT NULL,
	`category` text DEFAULT 'kajian' NOT NULL,
	`banner_url` text,
	`image_url` text,
	`max_capacity` integer DEFAULT 0 NOT NULL,
	`capacity` integer DEFAULT 0 NOT NULL,
	`registered_count` integer DEFAULT 0 NOT NULL,
	`current_registrations` integer DEFAULT 0 NOT NULL,
	`is_registration_open` integer DEFAULT true NOT NULL,
	`require_check_in` integer DEFAULT false NOT NULL,
	`min_donation` real,
	`is_fundraising` integer DEFAULT false,
	`target_amount` real,
	`collected_amount` real DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`category` text DEFAULT 'diskusi' NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_pinned` integer DEFAULT false,
	`is_banned` integer DEFAULT false,
	`like_count` integer DEFAULT 0,
	`comment_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'umum' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`condition` text DEFAULT 'good' NOT NULL,
	`location` text NOT NULL,
	`purchase_date` integer,
	`purchase_price` real,
	`source` text,
	`notes` text,
	`maintenance_log` text,
	`last_maintenance` integer,
	`maintenance_interval_days` integer,
	`next_maintenance_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `knowledge_snippets` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`content` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`expiration_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`cloudinary_url` text NOT NULL,
	`r2_key` text,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`event_tag` text,
	`is_watermarked` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monthly_prayer_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`days` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mustahiks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`nik` text,
	`category` text DEFAULT 'miskin' NOT NULL,
	`address` text,
	`phone` text,
	`family_members` integer DEFAULT 1,
	`status` text DEFAULT 'active' NOT NULL,
	`assistance_received` real DEFAULT 0,
	`last_assistance_date` integer,
	`registration_date` integer DEFAULT (unixepoch()) NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`is_broadcast` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`image_url` text,
	`order` integer DEFAULT 0 NOT NULL,
	`bio` text,
	`social_links` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`type` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`config` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prayer_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`date` text,
	`day` text NOT NULL,
	`prayer_time` text NOT NULL,
	`time` text NOT NULL,
	`imam_name` text,
	`khatib_name` text,
	`khutbah_topic` text,
	`khutbah_file_url` text,
	`is_locked` integer DEFAULT false,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `statement_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`file_hash` text NOT NULL,
	`file_name` text NOT NULL,
	`processed_at` integer DEFAULT (unixepoch()) NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`owner_id` text NOT NULL,
	`address` text,
	`city` text,
	`phone` text,
	`email` text,
	`latitude` real,
	`longitude` real,
	`timezone` text DEFAULT 'Asia/Jakarta',
	`banner_url` text,
	`logo_url` text,
	`legal_doc_url` text,
	`running_text` text,
	`bank_info` text,
	`bank_accounts` text,
	`dkm_structure` text,
	`prayer_calculation_method` text DEFAULT 'KEMENAG',
	`social_links` text,
	`bio` text,
	`status` text DEFAULT 'active' NOT NULL,
	`ai_enabled` integer DEFAULT false,
	`selected_persona` text DEFAULT 'marbot_muda',
	`kiosk_running_text` text,
	`kiosk_prayer_mode` text DEFAULT 'silent',
	`sholat_duration` integer DEFAULT 15,
	`iqomah_minutes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`date` integer NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`payment_method` text,
	`reference_number` text,
	`receipt_url` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`tenant_ids` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'jamaah' NOT NULL,
	`phone` text,
	`avatar_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_banned` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ustadz` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`specialization` text NOT NULL,
	`bio` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `zis_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`date` integer NOT NULL,
	`type` text NOT NULL,
	`flow` text DEFAULT 'in' NOT NULL,
	`amount` real NOT NULL,
	`muzakki_name` text,
	`muzakki_email` text,
	`muzakki_phone` text,
	`mustahik_id` text,
	`payment_method` text,
	`payment_status` text,
	`payment_reference` text,
	`payment_gateway` text,
	`payment_date` integer,
	`distribution_status` text,
	`distributed_to` text,
	`distributed_amount` real,
	`notes` text,
	`description` text,
	`receipt_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
