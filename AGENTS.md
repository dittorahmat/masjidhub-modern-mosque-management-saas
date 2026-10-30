# Agent Guidelines & Engineering Rules for MasjidHub

Welcome to MasjidHub. All AI agents working on this codebase MUST strictly follow these foundational architectural and development conventions.

---

## 1. Persistence & Database
- **No Durable Objects:** Legacy Cloudflare Durable Objects (`worker/entities.ts`, `IndexedEntity`) are deprecated. Do NOT introduce new Durable Objects or stateful DO classes.
- **Drizzle ORM with D1 / SQLite:** All persistence must use **Drizzle ORM** with schemas declared in `worker/db/schema.ts`.
- **Dual Compatibility:** Ensure queries run seamlessly across both Cloudflare D1 (`drizzle-orm/d1`) and local/VPS SQLite (`better-sqlite3`). Use `getDb(env)` from `worker/db` to acquire the database instance.
- **Migrations:** When altering the schema, use `bun run db:generate` to generate Drizzle SQL migrations under `drizzle/migrations/`.

---

## 2. Standardized Timestamps
- **Epoch Milliseconds:** All `createdAt`, `updatedAt`, `timestamp`, `date`, and other temporal values must be standardized to epoch milliseconds (`Date.now()`).
- **Defensive Mappers:** Because SQLite default values may use unix seconds (`unixepoch()`), all data mappers (located in `worker/routes/common.ts`) must use `toTimestampMs(val)` or check `val > 1e11 ? val : val * 1000` before exposing to the frontend.
- **UI Date Safety:** Never allow raw Unix seconds to reach frontend components formatting with `new Date(val)` or `format(val, ...)` to prevent "Jan 1, 1970" rendering bugs.

---

## 3. Storage & File Serving
- **Unified StorageService:** File uploads and retrievals must use the `StorageService` abstraction from `worker/storage/index.ts`.
- **Global Storage Route:** Files served via storage URLs must route through the global `/api/storage/:key` abstraction (which serves both R2 bucket contents in Cloudflare and local disk files in VPS deployments).
- **Slug Aliases:** Any legacy `:slug/storage/:key` URLs must alias to the same storage service handler for backward compatibility.

---

## 4. Modular Route Architecture
- **Keep Routers Modular:** The main `worker/user-routes.ts` is an aggregator. Place all route handlers into domain modules under `worker/routes/`:
  - `auth.ts` - Login, registration, session `/me`, demo users.
  - `tenants.ts` - Subdomain check, tenant listing, member management.
  - `finance.ts` - Financial transactions, OCR bank statements, summaries, report card.
  - `zis.ts` - Zakat/Infaq/Shadaqah transactions, Mustahik management, distribution.
  - `operations.ts` - Inventory items, community events, QR attendance, prayer schedules.
  - `content.ts` - Blog, forum moderation, DKM visual organization, AI chatbot, storage.
  - `super-admin.ts` - Platform admin dashboards, tenant approvals, feature toggles.
  - `common.ts` - Shared mappers, timestamp utilities, tenant resolution helpers.

---

## 5. Active Health Checks
- The `/api/health` endpoint must actively verify database connectivity with a live query (`SELECT 1`) and report `{ success: true, data: { status: 'healthy', database: 'connected', timestamp: Date.now() } }`.

---

## 6. Documentation Integrity
- **No Documentation Drift:** When modifying backend architectures, configuration scripts, or API contracts, immediately synchronize `GEMINI.md`, `README.md`, and `docs/architecture-backend.md`.
