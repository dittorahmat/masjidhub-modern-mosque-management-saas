---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments: [
  '_bmad-output/brainstorming/brainstorming-session-2026-02-23.md',
  '_bmad-output/project-context.md',
  'docs/index.md',
  'docs/architecture-frontend.md',
  'docs/architecture-backend.md',
  'docs/api-contracts-backend.md',
  'docs/data-models-backend.md',
  'docs/ui-component-inventory-frontend.md',
  'docs/source-tree-analysis.md',
  'docs/development-guide.md',
  'docs/deployment-guide.md'
]
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 9
workflowType: 'prd'
classification:
  projectType: saas_b2b
  domain: religious_community_management
  complexity: medium_high
  projectContext: brownfield
  tech_stack:
    ai_model: gemini-2.5-flash-lite
    architecture: gemini_native_long_context_processing
    workflow: manual_approval_knowledge_inbox
---

# Product Requirements Document - MasjidHub "Smart Masjid" Platform

**Author:** Juragan
**Date:** 2026-02-23

## Executive Summary

MasjidHub bertujuan untuk mentransformasi operasional masjid melalui platform "Smart Masjid" yang terintegrasi. Proyek ini mencakup pengembangan sistem manajemen konten (CMS) cerdas, Media Library otomatis, Page Builder berbasis puzzle, dan modul "Intelligent User Engagement" (AI Chat). Target utamanya adalah membebaskan pengurus masjid (DKM) dari beban administratif rutin dan hambatan teknis desain, sembari menyediakan layanan informasi 24/7 yang responsif, akurat, dan beradab bagi umat.

### What Makes This Special

Produk ini membedakan diri melalui empat pilar integrasi vertikal:
1. **Integrated Knowledge Ecosystem:** Koneksi native antara data operasional (ZIS, Inventaris, Jadwal) dengan konten publik (Blog, Page Builder) dan asisten AI (Gemini).
2. **Simplified Creation (Puzzle-style):** Pengurus masjid dapat membangun portal profesional tanpa keahlian desain melalui sistem builder berbasis blok yang aman dari kesalahan visual (Design Guard).
3. **Native Long-Context Efficiency:** Memanfaatkan kemampuan pemrosesan dokumen asli Gemini untuk efisiensi infrastruktur tanpa memerlukan database vektor atau RAG tradisional.
4. **Ethics & Transparency Control:** Kontrol otonomi AI yang fleksibel (Autonomy Slider) dan laporan keuangan instan berbasis infografis untuk transparansi sosial.

## Project Classification

- **Project Type:** SaaS B2B (Multi-tenant Platform)
- **Domain:** Religious Community Management
- **Complexity:** Medium-High
- **Project Context:** Brownfield (Enhancement of existing system)

## Success Criteria

### User Success
- **DKM:** Reduksi beban kerja administratif. Target: AI menangani >70% FAQ otonom.
- **Jamaah:** Kepuasan interaksi > 4.5/5 bintang.
- **Engagement:** Peningkatan *Donation Conversion Rate* dari pertanyaan terkait ZIS minimal sebesar 15%.

### Business Success
- **Retention:** Penurunan *churn rate* masjid yang mengaktifkan fitur AI/CMS sebesar 10%.
- **Adopsi:** 20% masjid aktif mengaktifkan modul baru dalam 6 bulan pertama.

### Technical Success
- **Performance (UX):** *First Token Time* (Streaming) < 1 detik; Jawaban lengkap selesai < 5 detik.
- **Accuracy:** 100% akurasi pada penarikan data angka operasional (Zero Hallucination Policy).

## Product Scope

### MVP - Minimum Viable Product
- **Core Chat AI:** Chat privat 1-on-1, Ustadz Co-Pilot (draf), Knowledge Inbox (PDF Only), Quick Snippets, dan Shadow Anonymity.
- **Smart CMS (Basic):** Editor artikel dengan "Smart Blocks" (Ayat/Hadits otomatis) dan manajemen kategori kajian.
- **Puzzle Page Builder:** Sistem drag-and-drop section untuk Landing Page dan Profil Masjid dengan **Design Guard**.
- **Media Library (Basic):** Unggah foto/video dengan **Auto-compression** dan **Auto-tagging** ke jadwal kegiatan.
- **Grounding Dasar:** Integrasi data Jadwal Shalat dan Kas Masjid.

### Growth Features (Post-MVP)
- **AI Autonomy:** Slider kendali otonomi penuh.
- **Advanced Media:** Watermark otomatis (opsional) dan dukungan file Word/Excel.
- **Social Transparency:** Generator infografis laporan keuangan untuk share ke WhatsApp.
- **Sermon-to-Post:** AI yang membantu merangkum khutbah menjadi artikel blog.
- **Smart Section Cloaking:** Sembunyi otomatis konten lama agar portal tetap terlihat segar.

## User Journeys

### 1. Pak Haji Ahmad (Jamaah - Success & Recovery Path)
Pak Haji membutuhkan info pendaftaran TPA di larut malam. Ia mendapatkan jawaban instan dari AI yang bersumber dari data masjid. Jika pertanyaan terlalu kompleks, AI secara santun meminta maaf dan meneruskan pesan ke Admin ("Eskalasi Santun").

### 2. Ustadz Firman (Ustadz - Co-Pilot & CMS Path)
Ustadz menerima draf jawaban AI untuk pertanyaan fiqih. Beliau juga menggunakan CMS MasjidHub untuk mempublikasikan draf khutbah Jumatnya menggunakan Smart Blocks untuk menyisipkan ayat Al-Quran secara instan.

### 3. Budi (DKM Admin - Knowledge & Page Building)
Budi memperbarui jadwal renovasi via Knowledge Inbox (PDF). Beliau juga memperbarui layout portal masjid menggunakan Page Builder untuk menonaktifkan section "Penggalangan Dana" yang sudah selesai dengan satu klik.

## Domain-Specific Requirements

### Knowledge Management & Grounding
- **Knowledge Inbox (PDF):** Dukungan unggah dokumen statis (Buku Fiqih, Laporan Tahunan) untuk diindeks Gemini Files API.
- **Quick Knowledge Snippets:** Input teks langsung untuk info dinamis yang menjadi prioritas kebenaran tertinggi bagi AI.
- **Correction Mechanism:** Dashboard admin untuk menandai jawaban AI sebagai "Salah" dan memasukkan koreksi yang otomatis dipelajari sistem.

### Technical Constraints & Privacy
- **Shadow Anonymity:** Implementasi hash identitas sekali pakai untuk mode anonim guna menjamin privasi absolut jamaah.
- **Immutable Audit Log:** Pencatatan seluruh interaksi AI ke dalam storage yang tidak dapat dihapus untuk keperluan audit.

### Risk Mitigations
- **Financial Grounding:** Kewajiban melampirkan tautan ke modul Keuangan untuk setiap jawaban berbasis angka.
- **Design Guard:** Pembatasan pilihan desain pada Page Builder untuk mencegah portal terlihat tidak profesional.

## Functional Requirements

### 1. Real-time Communication (Chat)
- **FR1:** Jamaah dapat mengirim pesan teks ke masjid melalui widget chat di Public Portal.
- **FR2:** Jamaah dapat memilih mode "Anonim" untuk menyembunyikan identitas asli.
- **FR3:** Admin dapat melihat dan membalas pesan melalui Shared Admin Inbox.
- **FR4:** Sistem melakukan *streaming* teks balasan AI secara real-time.

### 2. AI Intelligent Assistance
- **FR5:** AI memberikan draf jawaban otomatis berdasarkan basis pengetahuan masjid.
- **FR6:** Admin dapat mengoreksi jawaban AI sebelum dikirim (Co-pilot mode).
- **FR7:** DKM Admin dapat mengatur tingkat otonomi AI via slider.
- **FR8:** Jamaah dapat memberikan rating (Like/Dislike) pada jawaban AI.

### 3. Smart CMS & Blog
- **FR9:** Admin dapat menulis dan mempublikasikan artikel kajian/berita masjid.
- **FR10:** Editor CMS mendukung "Smart Blocks" untuk menyisipkan teks Arab Ayat Al-Quran & Hadits secara otomatis.
- **FR11:** Admin dapat menyematkan widget donasi aktif langsung di dalam artikel.
- **FR12:** AI dapat mengonversi poin khutbah menjadi draf artikel blog (AI Sermon-to-Post).

### 4. Puzzle Page Builder
- **FR13:** Admin dapat menyusun tata letak portal menggunakan sistem blok/section (Puzzle-style).
- **FR14:** Sistem menerapkan **Design Guard** (kunci warna/font) agar portal tetap konsisten.
- **FR15:** Admin dapat mengatur visibilitas setiap section (Profil, Jadwal, Donasi, Blog).

### 5. Advanced Media Library
- **FR16:** Sistem otomatis mengelompokkan foto berdasarkan jadwal event (Smart Tagging).
- **FR17:** Sistem melakukan kompresi otomatis pada gambar/video saat upload.
- **FR18:** Admin dapat mengaktifkan watermark masjid secara opsional pada foto.

### 6. SaaS B2B & Governance
- **FR19:** Isolasi data per masjid menggunakan ID file unik di Gemini Files API.
- **FR20:** Pencatatan penggunaan token AI per interaksi untuk audit biaya.
- **FR21:** Super Admin dapat menonaktifkan modul AI per tenant (Panic Button).

## Non-Functional Requirements

### Performance
- **Streaming Latency:** Token pertama jawaban AI muncul dalam < 1 detik.
- **System Responsiveness:** Navigasi dashboard admin chat/CMS < 500ms.

### Security & Privacy
- **Data Encryption:** Enkripsi data chat at-rest (AES-256) dan in-transit (TLS 1.3).
- **Shadow Privacy:** Masking identitas jamaah otomatis dalam mode anonim.

### Reliability & Scalability
- **Uptime:** Target ketersediaan layanan 99.9% via Cloudflare Edge.
- **Resource Management:** Pembatasan memori Durable Object (128MB).
- **Economic Scalability:** Biaya operasional AI terjaga dalam margin profit.

### Accessibility & Inclusivity
- **Universal Design:** Kepatuhan WCAG 2.1 Level AA untuk aksesibilitas lansia.
- **Readability:** Output AI menggunakan Bahasa Indonesia yang sederhana dan lugas.
