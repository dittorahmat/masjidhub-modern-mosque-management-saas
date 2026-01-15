# MasjidHub - Modern Mosque Management SaaS

## Project Overview

**MasjidHub** is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations. It provides a centralized dashboard for managing finances, ZIS (Zakat, Infaq, Shadaqah), inventory, community events, and prayer schedules.

The platform utilizes a **multi-tenant architecture**, where each mosque is an isolated tenant identified by a unique subdomain (slug). Data isolation is strictly enforced via tenant IDs in the backend.

### Technology Stack

*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
*   **Backend:** Cloudflare Workers, Hono (web framework), Durable Objects (state & storage).
*   **State Management:** Zustand v5 (Frontend), Durable Objects (Backend).
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
| `bun run build` | Build the frontend and worker for production. |
| `bun run deploy` | Deploy the application to Cloudflare. |
| `bun run lint` | Run ESLint to check for code quality issues. |
| `bun run cf-typegen` | Generate Cloudflare Worker types. |

**Note:** The `bun run dev` command starts a local server using `wrangler dev`, which simulates the Cloudflare Workers environment locally on port `8787`.

## Architecture Details

### Directory Structure

*   **`src/`**: Frontend source code.
    *   **`components/`**: UI components (shadcn/ui primitives in `ui/`, feature components like `app-sidebar.tsx`).
    *   **`pages/`**: Application routes (e.g., `dashboard/`, `auth/`, `super-admin/`).
    *   **`lib/`**: Utilities, API client (`api-client.ts`), and global store (`store.ts`).
*   **`worker/`**: Backend source code (Cloudflare Worker).
    *   **`index.ts`**: Entry point, middleware, and router setup.
    *   **`user-routes.ts`**: API endpoint definitions.
    *   **`entities.ts`**: Business logic and data models.
    *   **`core-utils.ts`**: Low-level Durable Object and storage abstractions.
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
*   **Backend Persistence:** All data is stored in Cloudflare Durable Objects. The `IndexedEntity` class in `worker/core-utils.ts` provides a high-level abstraction for CRUD operations.

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