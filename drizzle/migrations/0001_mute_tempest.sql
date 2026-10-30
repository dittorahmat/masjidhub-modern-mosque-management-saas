CREATE TABLE `kajian_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`ustadz_name` text,
	`youtube_url` text NOT NULL,
	`youtube_video_id` text NOT NULL,
	`description` text,
	`duration` text,
	`category` text DEFAULT 'kajian_rutin',
	`thumbnail_url` text,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `tenants` ADD `qris_image_url` text;