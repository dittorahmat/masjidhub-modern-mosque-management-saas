import { Hono } from "hono";
import { registerBlogRoutes } from "./content/blog";
import { registerForumRoutes } from "./content/forum";
import { registerOrganizationRoutes } from "./content/organization";
import { registerAIChatRoutes } from "./content/ai-chat";
import { registerStorageRoutes } from "./content/storage";
import { registerMiscRoutes } from "./content/misc";

export function registerContentRoutes(app: Hono<any>) {
  registerBlogRoutes(app);
  registerForumRoutes(app);
  registerOrganizationRoutes(app);
  registerAIChatRoutes(app);
  registerStorageRoutes(app);
  registerMiscRoutes(app);
}

export * from "./content/blog";
export * from "./content/forum";
export * from "./content/organization";
export * from "./content/ai-chat";
export * from "./content/storage";
export * from "./content/misc";
