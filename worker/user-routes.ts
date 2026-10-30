import { Hono } from "hono";
import { registerAuthRoutes } from "./routes/auth";
import { registerTenantRoutes } from "./routes/tenants";
import { registerFinanceRoutes } from "./routes/finance";
import { registerZisRoutes } from "./routes/zis";
import { registerOperationsRoutes } from "./routes/operations";
import { registerContentRoutes } from "./routes/content";
import { registerSuperAdminRoutes } from "./routes/super-admin";

// Re-export common functions and mappers for backward-compatibility
export * from "./routes/common";

/**
 * Registers all domain route modules on the Hono app instance.
 */
export function userRoutes(app: Hono<any>) {
  registerAuthRoutes(app);
  registerTenantRoutes(app);
  registerFinanceRoutes(app);
  registerZisRoutes(app);
  registerOperationsRoutes(app);
  registerContentRoutes(app);
  registerSuperAdminRoutes(app);
}
