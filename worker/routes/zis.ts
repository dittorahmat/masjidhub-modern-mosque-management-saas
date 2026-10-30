import { Hono } from "hono";
import { registerZisTransactionRoutes } from "./zis/transactions";
import { registerMustahikRoutes } from "./zis/mustahik";

export function registerZisRoutes(app: Hono<any>) {
  registerZisTransactionRoutes(app);
  registerMustahikRoutes(app);
}

export * from "./zis/transactions";
export * from "./zis/mustahik";
