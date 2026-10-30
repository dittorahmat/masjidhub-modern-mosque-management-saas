# MasjidHub - Modern Mosque Management SaaS

## Project Overview

**MasjidHub** is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations. It provides a centralized dashboard for managing finances, ZIS (Zakat, Infaq, Shadaqah), inventory, community events, and prayer schedules.

The platform utilizes a **multi-tenant architecture**, where each mosque is an isolated tenant identified by a unique subdomain (slug). Data isolation is strictly enforced via tenant IDs in the backend.

### Technology Stack

*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
*   **Backend:** Cloudflare Workers, Hono (web framework), Drizzle ORM.
*   **Database & Persistence:** Cloudflare D1 (Edge) & SQLite (VPS/Local Fallback).
*   **Object Storage:** Cloudflare R2 & Local Disk Fallback (`worker/storage/`).
*   **State Management:** Zustand v5 (Frontend), D1/SQLite Database (Backend).
*   **Package Manager:** Bun.

## Building and Running

The project uses `bun` as the primary package manager and task runner.

### Prerequisites

*   [Bun](https://bun.sh/) (latest version recommended)
*   Node.js (for some tooling compatibility)

### Key Commands

| Command | Description |
| :--- | :--- |
| `bun install` | Install all dependencies. |
| `bun run dev` | Start the local development server (Frontend + Worker). |
| `bun run start` | Start the standalone VPS server using Bun runtime. |
| `bun run start:node` | Start the standalone VPS server using Node runtime. |
| `bun run build` | Build the frontend and worker for production. |
| `bun run deploy` | Deploy the application to Cloudflare. |
| `bun run lint` | Run ESLint to check for code quality issues. |
| `bun run cf-typegen` | Generate Cloudflare Worker types. |
| `bun run db:migrate:local` | Apply D1 database migrations locally. |
| `bun run db:migrate:remote` | Apply D1 database migrations to Cloudflare D1 remote. |
| `bun run db:seed` | Seed database with initial tenants, users, and transactions. |

**Note:** The `bun run dev` command starts a local server using `wrangler dev`, which simulates the Cloudflare Workers environment locally on port `8787`.

## Architecture Details

### Directory Structure

*   **`src/`**: Frontend source code.
    *   **`components/`**: UI components (shadcn/ui primitives in `ui/`, feature components like `app-sidebar.tsx`).
    *   **`pages/`**: Application routes (e.g., `dashboard/`, `auth/`, `super-admin/`).
    *   **`lib/`**: Utilities, API client (`api-client.ts`), and global store (`store.ts`).
*   **`worker/`**: Backend source code (Cloudflare Worker & Node/Bun VPS Server).
    *   **`index.ts`**: Entry point, middleware, health check, and router setup.
    *   **`user-routes.ts`**: Main router aggregator importing domain modules from `routes/`.
    *   **`routes/`**: Modular domain route handlers:
        *   `auth.ts`: Authentication, demo users, registration.
        *   `tenants.ts`: Mosque tenant lookups and member management.
        *   `finance.ts`: Transactions, bulk imports, statement parsing, report cards.
        *   `zis.ts`: Zakat/Infaq/Shadaqah, Mustahik management, payments.
        *   `operations.ts`: Inventory assets, events & QR registrations, prayer schedules.
        *   `content.ts`: Blog, forum, DKM structure, AI chat, media & storage.
        *   `super-admin.ts`: Platform administration, approvals, AI toggles.
        *   `common.ts`: Centralized timestamp mappers and route helpers.
    *   **`db/`**: Drizzle ORM configuration, database abstraction (`getDb`), and schemas (`schema.ts`).
    *   **`storage/`**: Cloudflare R2 & Local Disk Object Storage abstraction (`StorageService`).
    *   **`server.ts` & `server-node.ts`**: Standalone VPS production servers for Bun and Node.js.
*   **`shared/`**: Code shared between Frontend and Backend.
    *   **`types.ts`**: TypeScript interfaces (contracts) for API responses and data models.
    *   **`mock-data.ts`**: Seed data for development.

### Multi-Tenancy Implementation

*   **Frontend:** The `DashboardLayout` detects the tenant slug from the URL (e.g., `/app/al-hikmah/dashboard`) and fetches the corresponding tenant context.
*   **Backend:** A middleware in `worker/index.ts` extracts the subdomain/slug from the request. All API operations require a valid tenant context to ensure data isolation.

### Demo System

The platform includes a built-in demo mode for testing:
*   **Demo URL:** Access `/login?demo=true` to see the demo role selector.
*   **Roles:** Super Admin, DKM Admin, Amil Zakat, Ustadz, and Jamaah.
*   **Default Tenant:** "Masjid Al-Hikmah" (`al-hikmah`) is automatically seeded as the default tenant.

## Development Conventions

*   **UI Components:** Use `shadcn/ui` components from `@/components/ui` whenever possible to maintain design consistency.
*   **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files unless absolutely necessary.
*   **State Management:**
    *   Use **Zustand** for global client-side state (user session, theme).
    *   Use **TanStack Query** (React Query) for server-state caching and fetching.
*   **API Communication:** Use the strongly-typed `api` helper from `@/lib/api-client` which wraps `fetch`.
*   **Backend Persistence:** All database persistence is handled via **Drizzle ORM** with **Cloudflare D1** on edge deployments and **SQLite** (via `better-sqlite3`) on local/VPS environments. Storage files (images, audio, PDF) are handled by **Cloudflare R2** with a local disk fallback via `/api/storage/:key`. Legacy Durable Objects and `IndexedEntity` are deprecated.
*   **Timestamps:** Standardized to epoch milliseconds (`Date.now()`). All schema mappers in `worker/routes/common.ts` safely normalize seconds to milliseconds so the UI never displays 1970 dates.

## Key Features

1.  **Dashboard:** Real-time overview of mosque statistics.
2.  **Financial Management:** Track income/expenses, visualize cash flow.
3.  **ZIS Module:** Manage Zakat, Infaq, Shadaqah transactions and Mustahik (recipients).
4.  **Inventory:** Track mosque assets, condition, and location.
5.  **Events:** Manage community activities, speakers, and registrations.
6.  **Forum:** Community discussion board with moderation tools.
7.  **Prayer Schedule:** Manage daily prayer times and Imam/Khatib assignments.
8.  **Public Portal (Instant Website):** A comprehensive public-facing site for each mosque with Prayer Schedule ribbon, Fundraising progress, and Khutbah archives.
9.  **Kiosk Mode:** Specialized TV-display mode for mosques showing live prayer times, running text, and financial transparency.
10. **Organization Management:** Visual DKM structure management to display mosque officials on the public portal.

## Implemented "ATM" Strategy (Amati, Tiru, Modifikasi)

We have successfully implemented several features inspired by competitors but enhanced for SaaS:

*   **Advanced ZIS Management:** 
    *   Manage Mustahik by Asnaf categories.
    *   Track ZIS distribution (outflow) and assistance status.
    *   Smart recommendations for zakat distribution.
*   **Event & Attendance:**
    *   QR Code Presensi (Check-in) system.
    *   Attendance rate analytics.
    *   Exportable attendance lists.
*   **Executive Dashboard:**
    *   Financial insights and alerts (e.g., large idle cash warnings).
    *   Visual cash flow analysis.
*   **Smart Assets:**
    *   Maintenance tracking for inventory items.

## Agent skills

### Issue tracker

GitHub issues via `gh` CLI. See [issue-tracker.md](file:///D:/development/masjidhub-modern-mosque-management-saas/docs/agents/issue-tracker.md).

### Triage labels

Canonical 5-role triage label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See [triage-labels.md](file:///D:/development/masjidhub-modern-mosque-management-saas/docs/agents/triage-labels.md).

### Domain docs

Single-context repository layout (`GLOSSARY.md` + `docs/adr/`). See [domain.md](file:///D:/development/masjidhub-modern-mosque-management-saas/docs/agents/domain.md).
