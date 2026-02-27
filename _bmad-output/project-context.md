---
project_name: 'masjidhub-modern-mosque-management-saas'
user_name: 'Juragan'
date: '2026-02-23T10:50:53.830Z'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 24
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Frontend:** React 18, TypeScript 5.8, Vite, Tailwind CSS 3.4, shadcn/ui, Zustand 5, TanStack Query 5, React Router Dom 6.30.
- **Backend:** Cloudflare Workers, Hono 4.9.8, Durable Objects (with SQLite migrations support).
- **Tooling:** Bun (Package Manager), ESLint 9, Zod 4.0.5.
- **Security & Architecture:**
    - Validasi input WAJIB dilakukan di Hono middleware sebelum menyentuh Durable Objects.
    - Pendekatan **Type-First**: Selalu update `shared/types.ts` sebelum memodifikasi `entities.ts` atau komponen Frontend.
    - Kesadaran akan limitasi memori Durable Objects (default 128MB per instance).

## Critical Implementation Rules

### Language-Specific Rules (TypeScript/JS)

- **Type Integrity:** **DILARANG** menggunakan `any`. Gunakan tipe dari `@shared/types`. Gunakan *Explicit Return Types* untuk fungsi/metode baru.
- **Import/Export:** Gunakan `import type` untuk tipe data. **DILARANG** menggunakan `require()` (proyek menggunakan ESM).
- **Path Aliasing:** Gunakan `@/*` untuk `src/` dan `@shared/*` untuk `shared/`. Hindari relative path panjang.
- **Asynchronous & Error Handling:** Selalu gunakan `async/await`. Di backend, gunakan `try/catch` dan petakan error ke helper `bad(c, error)` atau `notFound(c, error)` dari `core-utils.ts`.
- **Durable Object Storage:** Pastikan semua operasi storage (`ctx.storage.get/put`) di-await dengan benar.

### Framework-Specific Rules (React & Hono)

- **Render Body Safety:** **DILARANG** memanggil state setter (`setXxx`) di render body atau hooks memoisasi (`useMemo`, `useCallback`).
- **Server State:** Gunakan TanStack Query v5. **WAJIB** sertakan `tenantId` atau `slug` dalam `queryKey` untuk isolasi cache browser.
- **Global State:** Gunakan Zustand v5 di `src/lib/store.ts`. Hindari menyimpan data besar yang bisa diambil dari API di store global.
- **UI Architecture:** Folder `src/components/ui/` (shadcn/ui) bersifat *read-only*. Bangun komponen fitur di folder `@/components/`.
- **Durable Objects:** Logika bisnis harus berada di `worker/entities.ts`. Gunakan `idFromName("entityName:id")` dan metode `mutate()` untuk update data yang aman (CAS logic).
- **Core Constraints:** **DILARANG** memodifikasi `worker/core-utils.ts`.

### Code Quality, Style & Testing Rules

- **Naming:** File (`kebab-case.ts`), Components (`PascalCase`), Functions (`camelCase`), Constants (`UPPER_SNAKE_CASE`).
- **Sizing:** Hindari 'God Components'. Pecah komponen jika >300 baris menjadi sub-komponen lokal.
- **Styling:** Gunakan Tailwind secara eksklusif. Urutkan class: Layout -> Box Model -> Typography -> Visual -> Interaction.
- **Documentation:** JSDoc harus menjelaskan **MENGAPA** (reasoning), bukan sekadar 'apa'. Sertakan contoh untuk utility baru.
- **Testing:** Gunakan Vitest. Letakkan file `.test.ts` berdampingan dengan unit yang dites.

### Development Workflow & Critical Don't-Miss Rules

- **Build Integrity:** **WAJIB** jalankan `bun run typecheck` dan `bun run build` sebelum mendeploy. Jangan deploy jika build gagal.
- **Anti-Patterns:**
    - **NO Infinite Loops:** Jangan panggil setter di render body. Hindari objek literal baru di render body jika jadi dependensi `useEffect`.
    - **NO Direct DO Access:** Jangan gunakan `ctx.storage` langsung di router Hono. Gunakan model entitas.
    - **NO Data Leakage:** Setiap query backend **WAJIB** memiliki filter `tenantId` yang divalidasi.
    - **NO Secrets in Code:** Jangan menaruh API key di kode. Gunakan Cloudflare bindings via `env`.

---

## Usage Guidelines

**For AI Agents:**
- Baca file ini sebelum implementasi kode.
- Ikuti SEMUA aturan secara eksis.
- Jika ragu, pilih opsi yang paling restriktif/aman.

**For Humans:**
- Jaga file ini tetap ramping (fokus pada kebutuhan AI).
- Update jika tech stack berubah.
- Tinjau secara berkala untuk membuang aturan yang sudah menjadi jelas/standar.

Last Updated: 2026-02-23
