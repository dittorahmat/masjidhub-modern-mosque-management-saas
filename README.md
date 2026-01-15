# MasjidHub - Modern Mosque Management SaaS

MasjidHub is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations, finance, inventory, and community events with role-based access control.

## Quickstart

1.  **Clone the repository**
2.  **Install dependencies**: `bun install`
3.  **Run development server**: `bun run dev`
4.  **Deploy to Cloudflare**: `bun run deploy`

## Key Features

### 🕌 Smart Public Portal
Every mosque gets an instant, professional website (`/portal/:slug`) featuring:
-   **Live Prayer Schedule:** With Imam/Khatib details.
-   **Fundraising Tracker:** Real-time progress bars for donation programs.
-   **Khutbah Archive:** Digital library of Friday sermons for jamaah.
-   **Visual Organization:** Display DKM profiles to build trust.

### 📺 Kiosk Mode
A dedicated display interface (`/kiosk/:slug`) for mosque TVs/Monitors:
-   **Big Screen Design:** High contrast, readable from a distance.
-   **Live Countdown:** To next prayer time.
-   **Financial Transparency:** Real-time cash balance display.
-   **Dynamic QRIS:** Large QR code for immediate infaq.

### 💰 Advanced ZIS Management
Professional Zakat, Infaq, Shadaqah module:
-   **Mustahik Database:** categorize recipients by 8 Asnaf (Fakir, Miskin, etc.).
-   **Distribution Tracking:** Record not just income, but precise distribution to mustahik.
-   **Smart Insights:** Auto-recommendations for fund distribution based on available balance.

### 📅 Event & Attendance
-   **E-Ticketing:** Digital registration for mosque events.
-   **QR Check-in:** Presensi system to track actual attendance.
-   **Analytics:** Measure engagement and attendance rates.

### 📊 Executive Dashboard
-   **Financial Alerts:** Smart warnings for deficits or excessive idle cash.
-   **Visual Analytics:** Rich charts for cash flow and member growth.

## Demo Login System

The platform includes a comprehensive demo login system that allows you to test the application with different user roles:

-   **Super Admin Platform**: `admin@masjidhub.com`
-   **DKM Admin**: `demo-dkm@masjid.org`
-   **Amil Zakat**: `demo-amil@masjid.org`
-   **Ustadz**: `demo-ustadz@masjid.org`
-   **Jamaah**: `demo-jamaah@masjid.org`

To access the demo mode, visit the login page with the `demo=true` parameter: `http://localhost:5173/login?demo=true`

In demo mode, you'll see a dropdown to select the role you want to test, and the email field will automatically populate with the appropriate demo email for the selected role.

## Code Structure

Below is an overview of the core project structure:

```text
masjidhub-saas/
├── shared/
│   ├── types.ts           # Shared TypeScript interfaces for API and Storage
│   └── mock-data.ts       # Initial seed data for development
├── src/
│   ├── components/
│   │   ├── ui/            # Shadcn UI primitives (Button, Card, Table, etc.)
│   │   ├── app-sidebar.ts # Multi-tenant aware sidebar navigation
│   │   └── GlobalLoading.tsx
│   ├── hooks/             # Custom React hooks (use-theme, use-mobile)
│   ├── lib/
│   │   ├── api-client.ts  # Typed fetch wrapper for /api endpoints
│   │   ├── store.ts       # Zustand v5 store with strict primitive selectors
│   │   └── utils.ts       # Tailwind CSS class merging utilities
│   ├── pages/
│   │   ├── auth/          # Login and Mosque Registration flows
│   │   ├── dashboard/     # Tenant-specific modules (Finance, ZIS, Inventory, Events, etc.)
│   │   ├── super-admin/   # Global platform management for Super Admins
│   │   ├── LandingPage.tsx
│   │   └── PublicPortalPage.tsx
│   └── main.tsx           # Application entry point & Router configuration
├── worker/
│   ├── core-utils.ts      # Durable Object persistence & Entity abstractions
│   ├── entities.ts        # Business logic for Tenant, User, Transaction, etc.
│   ├── index.ts           # Hono Worker entry point
│   └── user-routes.ts     # API route definitions
├── public/
│   └── manifest.json      # PWA Configuration for mobile-ready features
└── wrangler.jsonc         # Cloudflare Workers & Durable Objects configuration
```

### Technical Architecture

#### Frontend
-   **React 18 & Vite**: Fast HMR and modern component architecture.
-   **React Router 6**: Utilizes `createBrowserRouter` for robust routing and error boundaries.
-   **Zustand v5**: Centralized state management using a "Primitive Selector" pattern to prevent unnecessary re-renders and infinite loops.
-   **Tailwind CSS**: Utility-first styling with a custom "Illustrative" theme (Emerald/Amber palette).

#### Backend
-   **Hono**: A small, fast web framework for Cloudflare Workers.
-   **Durable Objects (DO)**: Provides strongly consistent storage. We use a single `GlobalDurableObject` binding as a KV-like engine, abstracted by an `IndexedEntity` library.
-   **Entities**: Data models like `TenantEntity` and `ZisTransactionEntity` encapsulate storage logic and index management.

#### Multi-Tenancy
-   **Isolation**: Each mosque (tenant) is identified by a unique `slug`.
-   **Resolution**: The `DashboardLayout` resolves the tenant context from the URL slug via the API, ensuring users only access mosques they are authorized to manage.
-   **RBAC**: Role-Based Access Control (Super Admin, DKM Admin, Amil, Ustadz, Jamaah) is enforced both in the UI (sidebar) and the API.

#### Progressive Web App (PWA)
-   **Mobile-Ready**: The application includes a `manifest.json` and mobile-optimized meta tags, allowing mosque admins and jamaah to "Install" the portal to their home screens for an app-like experience.

For a full view of all files, please refer to the internal repository file tree.
