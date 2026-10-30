import { Hono } from "hono";
import { registerInventoryRoutes } from "./operations/inventory";
import { registerEventRoutes } from "./operations/events";
import { registerPrayerRoutes } from "./operations/prayers";

export function registerOperationsRoutes(app: Hono<any>) {
  registerInventoryRoutes(app);
  registerEventRoutes(app);
  registerPrayerRoutes(app);
}

export * from "./operations/inventory";
export * from "./operations/events";
export * from "./operations/prayers";
