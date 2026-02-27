# Architecture Documentation - Backend

## Executive Summary
Backend MasjidHub adalah aplikasi serverless berbasis Cloudflare Workers yang menggunakan arsitektur **Layered Architecture with Durable Objects**. Aplikasi ini dirancang untuk skalabilitas tinggi dan isolasi data multi-tenant di atas infrastruktur Cloudflare.

---

## Technology Stack
- **Framework Utama:** Hono ^4.9.8
- **Runtime:** Cloudflare Workers (compatibility "2025-04-24")
- **Penyimpanan Stateful:** Durable Objects (dengan dukungan SQLite migrations)
- **Language:** TypeScript 5.8
- **Validation:** Zod 4.0.5

---

## Architecture Patterns
### 1. Layered Architecture (Entities & Stubs)
Logika penyimpanan dan manipulasi data dienkapsulasi dalam class `Entity` dan `IndexedEntity` di `worker/entities.ts` dan `worker/core-utils.ts`.
- **Durable Objects:** Digunakan sebagai penyimpanan stateful dan konsisten.
- **Index Management:** `IndexedEntity` menangani pembuatan indeks untuk pencarian dan pemisahan data berdasarkan `tenantId`.

### 2. Multi-tenant Context Resolution
Middleware di `worker/index.ts` mengekstrak `subdomain` atau `slug` dari URL request untuk menentukan konteks tenant sebelum rute dijalankan.

---

## Data Architecture
### 1. Persistence (Durable Objects storage)
Data disimpan sebagai dokumen JSON dengan kontrol versi (CAS - Compare-And-Swap) untuk mencegah konflik pembaruan data yang bersamaan.
### 2. SQLite Migrations
Mendukung migrasi skema SQL di dalam Durable Objects untuk pengelolaan struktur data yang lebih kompleks di masa depan.

---

## API Design
Backend mengekspos RESTful API via Hono dengan struktur respon yang seragam (`ApiResponse<T>`).
- **Auth:** Pendaftaran dan login berbasis email (dengan role demo).
- **Tenant API:** Operasi CRUD untuk Finance, ZIS, Inventory, Events, dan Forum.
- **Super Admin API:** Statistik global dan persetujuan pendaftaran masjid.

---

## Deployment Architecture
- **Infrastructure:** Cloudflare Global Edge Network.
- **CI/CD:** GitHub Actions (disarankan) atau Wrangler CLI (`bun run deploy`).
- **Penyimpanan:** Durable Objects (DQL/SQLite) untuk konsistensi kuat.
