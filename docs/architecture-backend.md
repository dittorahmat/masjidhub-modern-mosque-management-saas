# Architecture Documentation - Backend

## Executive Summary
Backend MasjidHub adalah backend web service modern multi-tenant yang dapat berjalan ganda: baik sebagai serverless edge application di atas **Cloudflare Workers** maupun sebagai standalone service di lingkungan **Node.js / Bun VPS**. 
Sistem menggunakan **Drizzle ORM** dengan **Cloudflare D1** (Edge) serta **SQLite** (`better-sqlite3`) untuk local/VPS fallback, bersama dengan **Cloudflare R2** & local filesystem storage abstraction untuk file objek. Arsitektur ini menggantikan sistem stateful Durable Objects sebelumnya demi efisiensi, fleksibilitas deployment, dan kemudahan migrasi database.

---

## Technology Stack
- **Framework Utama:** Hono ^4.9.8 (dengan routing modular di `worker/routes/`)
- **Runtime:** Cloudflare Workers (compatibility "2025-04-24") serta Node.js / Bun runtime (VPS standalone)
- **Database & ORM:** Drizzle ORM dengan Cloudflare D1 (Edge) & SQLite (`better-sqlite3`, Local/VPS Fallback)
- **Object Storage:** Cloudflare R2 & Local Disk Fallback (`worker/storage/`)
- **Language:** TypeScript 5.8
- **Validation:** Zod & TypeScript type contracts (`@shared/types`)

---

## Architecture Patterns
### 1. Modular Domain Routing
Rute backend dipecah secara modular berdasarkan bounded context di direktori `worker/routes/`:
- `auth.ts`: Registrasi masjid, login, demo accounts, `/api/auth/me`.
- `tenants.ts`: Validasi subdomain/slug, direktori tenant, keanggotaan DKM.
- `finance.ts`: Transaksi keuangan, bulk import, OCR bank statement parsing (Gemini AI), report card visual.
- `zis.ts`: Transaksi Zakat, Infaq, Shadaqah, manajemen Mustahik asnaf, kalkulasi & penyaluran.
- `operations.ts`: Inventaris masjid (aset & jadwal maintenance), Event & pendaftaran dengan QR presensi, Prayer Schedule sync.
- `content.ts`: CMS Blog, forum diskusi, bagan struktur organisasi DKM, AI Chatbot (marbot persona), storage & media serving.
- `super-admin.ts`: Metrik global platform, approval pendaftaran masjid, toggle fitur AI.
- `common.ts`: Centralized timestamp normalization (`toTimestampMs`), D1/SQLite schema mappers, dan tenant context resolvers.

### 2. Multi-tenant Context Resolution
Middleware di `worker/index.ts` mengekstrak `subdomain` atau parameter `:slug` dari URL request untuk menentukan konteks tenant sebelum rute dijalankan, menjamin isolasi data berdasarkan `tenantId`.

### 3. Unified Storage Abstraction
Akses file statis & upload diabstraksikan melalui interface `StorageService` (`worker/storage/index.ts`), menyajikan file melalui route publik `/api/storage/:key` (dengan backward-compatible alias `/api/:slug/storage/:key` dan `/uploads/:key`).

---

## Data Architecture
### 1. Drizzle ORM & Cloudflare D1 / SQLite Schemas
Semua tabel didefinisikan dalam `worker/db/schema.ts`. Drizzle Kit mengelola migrasi SQL di folder `drizzle/migrations/`.
- **Edge Deployment:** Terhubung ke Cloudflare D1 via binding `c.env.DB`.
- **Local/VPS Deployment:** Menggunakan SQLite file (`data/sqlite.db`) melalui `better-sqlite3` tanpa memerlukan akun Cloudflare.

### 2. Standardized Timestamps
Semua timestamp (`createdAt`, `updatedAt`, `timestamp`, `date`, dll.) distandarisasi ke format epoch milliseconds (`Date.now()`). Layer mapper di `worker/routes/common.ts` menjamin konversi konsisten antara format second di database (jika berasal dari SQL unixepoch) ke millisecond agar kompatibel 100% dengan frontend JavaScript Date tanpa resiko bug tahun 1970.

---

## API Design
Backend mengekspos RESTful API via Hono dengan struktur respon yang seragam (`ApiResponse<T>`).
- **Health Check (`GET /api/health`):** Menguji konektivitas database secara aktif (`SELECT 1`) dan mengembalikan status koneksi database.
- **Auth:** Pendaftaran dan login berbasis email (dengan role demo).
- **Tenant API:** Operasi CRUD untuk Finance, ZIS, Inventory, Events, dan Forum.
- **Super Admin API:** Statistik global dan persetujuan pendaftaran masjid.
- **Storage API:** Upload file (`POST /api/upload`) dan pengunduhan file (`GET /api/storage/:key`).

---

## Deployment Architecture
- **Cloudflare Edge Deployment:**
  - Runtime: Cloudflare Workers
  - Database: Cloudflare D1
  - Object Storage: Cloudflare R2
  - Perintah migrasi: `bun run db:migrate:remote` / `wrangler d1 migrations apply masjidhub-db --remote`
  - Perintah deploy: `bun run deploy`
- **Standalone VPS Deployment:**
  - Runtime: Bun (`bun run start`) atau Node.js (`bun run start:node`)
  - Database: Local SQLite file (`data/sqlite.db`)
  - Object Storage: Local filesystem (`./uploads`)
