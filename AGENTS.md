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
- **Epoch Milliseconds:** All `createdAt`, `updatedAt`, `timestamp`, `date`, and other temporal values must be standardized to epoch milliseconds (`Date.now()`). Never use unix seconds (`Math.floor(Date.now() / 1000)`) in insert/update queries.
- **Defensive Mappers:** Because SQLite default values may use unix seconds (`unixepoch()`), all data mappers (located in `worker/routes/common.ts`) must use `toTimestampMs(val)` or check `val > 1e11 ? val : val * 1000` before exposing to the frontend.
- **UI Date Safety:** Never allow raw Unix seconds to reach frontend components formatting with `new Date(val)` or `format(val, ...)` to prevent "Jan 1, 1970" rendering bugs.

---

## 3. Storage & File Serving
- **Unified StorageService:** File uploads and retrievals must use the `StorageService` abstraction from `worker/storage/index.ts`.
- **Global Storage Route:** Files served via storage URLs must route through the global `/api/storage/:key` abstraction (which serves both R2 bucket contents in Cloudflare and local disk files in VPS deployments).
- **Slug Aliases:** Any legacy `:slug/storage/:key` URLs must alias to the same storage service handler for backward compatibility.

---

## 4. Modular Route Architecture & Anti-Monolith Policy
- **STRICT FILE SIZE CAP (Max 400-500 LOC per file):** No route handler, page, or utility file may exceed ~500 lines of code. Monolithic files like the legacy 3,200+ LOC `worker/user-routes.ts` are strictly forbidden. If a file grows beyond 400 LOC, proactively decompose it into sub-modules (e.g. `finance/ocr.ts`, `finance/transactions.ts`).
- **Aggregator Pattern Only:** The main `worker/user-routes.ts` is strictly a top-level aggregator (under ~100 LOC) that mounts sub-routers. NEVER add business logic, raw SQL, or route handler bodies directly into `user-routes.ts`.
- **Domain Separation:** Place all route handlers into domain modules under `worker/routes/`:
  - `auth.ts` - Login, registration, session `/me`, demo users.
  - `tenants.ts` - Subdomain check, tenant listing, member management.
  - `finance.ts` - Financial transactions, OCR bank statements, summaries, report card.
  - `zis.ts` - Zakat/Infaq/Shadaqah transactions, Mustahik management, distribution.
  - `operations.ts` - Inventory items, community events, QR attendance, prayer schedules.
  - `content.ts` - Blog, forum moderation, DKM visual organization, AI chatbot, storage, rekaman kajian.
  - `super-admin.ts` - Platform admin dashboards, tenant approvals, feature toggles.
  - `common.ts` - Shared mappers, timestamp utilities, tenant resolution helpers.
- **Frontend Component Hygiene:** The same anti-monolith rule applies to frontend pages (`src/pages/*`). Break complex views with multiple tabs or modals into subcomponents under `src/components/<feature>/` (e.g., `src/components/qris/`, `src/components/kajian/`) instead of dumping all JSX, state, and dialogs into a single monolithic page file.
- **File-Size Check Command:** Always run `bun run validate` (`tsc -b && bun run check:size`) before reporting any task or committing changes to ensure no files exceed the 500 LOC cap.

---

## 5. Code Hygiene, Shared Utilities & Scope Discipline
- **Zero Scope Creep on Commits:** Never stage or commit extraneous tooling files, agent frameworks (e.g. `.agents/`, `.qwen/`, `.scratch/`), or scratch transcripts into application feature commits. Feature commits must only include production code and tests.
- **API Client Calling Signature:** When communicating with backend endpoints from frontend components, use the strongly-typed `api` helper from `@/lib/api-client`:
  ```ts
  // GET:
  const data = await api<DataType>(`/api/${slug}/endpoint`);
  // POST / PUT / DELETE:
  await api(`/api/${slug}/endpoint`, { method: 'POST', body: JSON.stringify(payload) });
  ```
  Do NOT assume Axios-style methods (`api.get`, `api.post`).
- **Centralized Shared Utilities & Navigation:** Common media or external service helpers (such as `extractYoutubeVideoId`, URL parsers, and data formatting) must live in `shared/` (e.g. `shared/youtube.ts`) rather than duplicating regex across frontend and backend. Similarly, tenant navigation routes, role-permission matrices, and menu trees must live in centralized frontend helpers (such as `src/lib/navigation.ts`) rather than duplicating route arrays across desktop sidebars, mobile bottom navigation bars, and off-canvas drawers.
- **Mobile Ergonomics & Touch Targets:** All interactive controls (buttons, icon triggers, form selectors, navigation items) must enforce a minimum 44x44px touch target area (`min-h-[44px] min-w-[44px]`) to ensure accessibility on mobile devices.
- **Defensive Form Typing:** Avoid untyped form payloads (`Record<string, any>` or raw `Object.fromEntries(formData)`). Explicitly type or validate form inputs with typed interfaces before invoking API mutations.
- **Endpoint Authorization:** Any mutations on tenant configuration (e.g. `PUT /api/:slug/settings`) must enforce tenant ownership/membership verification.

---

## 6. Active Health Checks
- The `/api/health` endpoint must actively verify database connectivity with a live query (`SELECT 1`) and report `{ success: true, data: { status: 'healthy', database: 'connected', timestamp: Date.now() } }`.

---

## 7. Documentation Integrity
- **No Documentation Drift:** When modifying backend architectures, configuration scripts, or API contracts, immediately synchronize `GEMINI.md`, `README.md`, and `docs/architecture-backend.md`.
