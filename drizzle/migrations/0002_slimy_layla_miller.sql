CREATE INDEX `idx_events_tenant_date` ON `events` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_events_tenant_category` ON `events` (`tenant_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_inventory_tenant_category` ON `inventory_items` (`tenant_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_inventory_tenant_location` ON `inventory_items` (`tenant_id`,`location`);--> statement-breakpoint
CREATE INDEX `idx_mustahiks_tenant_status` ON `mustahiks` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_mustahiks_tenant_category` ON `mustahiks` (`tenant_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_transactions_tenant_date` ON `transactions` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_tenant_category` ON `transactions` (`tenant_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_transactions_tenant_type` ON `transactions` (`tenant_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_zis_tenant_date` ON `zis_transactions` (`tenant_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_zis_tenant_flow` ON `zis_transactions` (`tenant_id`,`flow`);--> statement-breakpoint
CREATE INDEX `idx_zis_tenant_type` ON `zis_transactions` (`tenant_id`,`type`);