# Architecture Documentation - Frontend

## Executive Summary
Frontend MasjidHub adalah aplikasi web modern berbasis React 18 yang menggunakan arsitektur **Feature-Sliced Design (FSD)**. Aplikasi ini dirancang untuk multi-tenancy, di mana setiap masjid memiliki portal publik dan dashboard admin yang terisolasi.

---

## Technology Stack
- **Library Utama:** React ^18.3.1
- **Build Tool:** Vite ^6.3.1
- **Language:** TypeScript 5.8
- **State Management:** Zustand ^5.0.6 (Global state) & TanStack Query ^5.83.0 (Server state)
- **Styling:** Tailwind CSS ^3.4.17
- **UI Components:** shadcn/ui (Radix UI)
- **Routing:** React Router Dom 6.30.0

---

## Architecture Patterns
### 1. Feature-Sliced Design (FSD)
Struktur proyek mengikuti prinsip FSD untuk modularitas:
- `src/components/ui/`: Komponen atomic dasar.
- `src/components/layout/`: Komponen tata letak (Sidebar, Navbar).
- `src/hooks/`: Custom hooks untuk tema dan deteksi mobile.
- `src/lib/`: Utilitas (API client, Zustand store).
- `src/pages/`: Kontainer halaman berdasarkan rute (Auth, Dashboard, Super Admin).

### 2. Multi-tenant Context Resolution
DashboardLayout mendeteksi `slug` dari URL (misal: `/app/al-hikmah/dashboard`) dan mengambil profil tenant via API untuk menyesuaikan tema dan data yang ditampilkan.

---

## Data Architecture
### 1. Server State Sync (TanStack Query)
Semua pengambilan data dari Worker API dikelola oleh TanStack Query untuk caching dan revalidation.
### 2. Client State (Zustand)
Digunakan untuk state yang bersifat transient seperti session user, preferensi tema, dan status sidebar.

---

## API Design
Aplikasi berkomunikasi dengan backend melalui wrapper `api` di `src/lib/api-client.ts` yang menjamin tipe data aman (Type-safe) menggunakan interface dari `@shared/types`.

---

## Development Workflow
- **Package Manager:** Bun
- **Linting:** ESLint 9
- **Dev Command:** `bun run dev`
- **Build Command:** `bun run build`
