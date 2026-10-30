# MasjidHub - Modern Mosque Management SaaS

MasjidHub is a comprehensive, multi-tenant SaaS platform designed to modernize mosque operations, finance, inventory, and community events with role-based access control.

## Quickstart & Cara Menjalankan Aplikasi

Aplikasi ini mendukung **Dual-Deployment**: dapat berjalan di **Cloudflare Workers (Edge + D1 + R2)** maupun standalone di **VPS / Docker / On-Premise (Node.js / Bun + SQLite + Local Storage)**.

### Persyaratan Awal (Prerequisites)
- [Bun](https://bun.sh/) (disarankan) atau Node.js v20+
- Salin konfigurasi environment:
  ```bash
  cp .env.example .env
  ```
- *Opsional (untuk fitur AI OCR Bank Statement & Chatbot):* Masukkan `GEMINI_API_KEY` di file `.env`.

---

### Opsi 1: Menjalankan di VPS / Server On-Premise (SQLite + Standalone)

Cocok untuk hosting mandiri di VPS (Ubuntu, Debian, dll.), Docker container, atau server on-premise masjid.

1. **Install dependencies:**
   ```bash
   bun install
   # atau jika menggunakan npm: npm install
   ```

2. **Migrasi & Seed database SQLite awal:**
   ```bash
   bun run db:seed:local
   ```
   *Perintah ini akan membuat database SQLite di `./data/sqlite.db` serta mengisi data default masjid `al-hikmah` dan 5 user demo.*

3. **Build frontend & server:**
   ```bash
   bun run build
   ```

4. **Jalankan server production:**
   ```bash
   # Menjalankan via Bun (Recommended):
   bun run start

   # Atau via Node.js:
   npm run start:node
   ```
   Aplikasi akan berjalan di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

---

### Opsi 2: Menjalankan di Cloudflare Workers (D1 + R2)

Cocok untuk serverless edge deployment Cloudflare dengan database D1 terdistribusi dan object storage R2.

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Jalankan local development:**
   ```bash
   bun run dev
   ```

3. **Apply migrasi & seed ke Cloudflare D1:**
   ```bash
   # Migrasi ke D1 lokal simulasi:
   npx wrangler d1 migrations apply masjidhub-db --local
   bun run db:seed:d1

   # Migrasi ke D1 remote production:
   npx wrangler d1 migrations apply masjidhub-db --remote
   bun run db:seed:d1 --remote
   ```

4. **Deploy ke Cloudflare Workers:**
   ```bash
   bun run deploy
   ```

---

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
-   **Hono**: Framework web ultra-ringan dan cepat yang cross-runtime (berjalan di Cloudflare Workers maupun Node.js / Bun).
-   **Database (Drizzle ORM & SQLite / D1)**:
    - Di Cloudflare Workers menggunakan **Cloudflare D1** (`drizzle-orm/d1`).
    - Di VPS / On-Premise menggunakan **SQLite** lokal (`better-sqlite3` di `./data/sqlite.db`).
-   **Storage**:
    - Di Cloudflare Workers menggunakan **Cloudflare R2** (`BUCKET`).
    - Di VPS / On-Premise otomatis fallback ke **Local Filesystem** (`./uploads`).
-   **AI Engine (Gemini 2.5 Flash Lite)**: Otomasi OCR pembaca rekening koran / bukti mutasi bank Indonesia dan AI chatbot asisten masjid.

#### Multi-Tenancy
-   **Isolation**: Each mosque (tenant) is identified by a unique `slug`.
-   **Resolution**: The `DashboardLayout` resolves the tenant context from the URL slug via the API, ensuring users only access mosques they are authorized to manage.
-   **RBAC**: Role-Based Access Control (Super Admin, DKM Admin, Amil, Ustadz, Jamaah) is enforced both in the UI (sidebar) and the API.

#### Progressive Web App (PWA)
-   **Mobile-Ready**: The application includes a `manifest.json` and mobile-optimized meta tags, allowing mosque admins and jamaah to "Install" the portal to their home screens for an app-like experience.

For a full view of all files, please refer to the internal repository file tree.
