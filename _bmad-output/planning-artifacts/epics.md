---
stepsCompleted: [step-01-init, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: [
  '_bmad-output/planning-artifacts/prd.md',
  '_bmad-output/planning-artifacts/architecture.md',
  '_bmad-output/planning-artifacts/ux-design-specification.md'
]
workflowType: 'architecture'
lastStep: 4
status: 'complete'
---

# masjidhub-modern-mosque-management-saas - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for masjidhub-modern-mosque-management-saas, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements
- **FR1:** Jamaah dapat mengirim pesan teks via Public Portal.
- **FR2:** Mode "Anonim" menggunakan Shadow ID.
- **FR3:** Admin dapat melihat/membalas via Shared Admin Inbox.
- **FR4:** Indikator status pengirim (AI vs Manusia).
- **FR5:** AI Streaming balasan secara real-time.
- **FR6:** Draf jawaban AI otomatis (Co-pilot).
- **FR7:** Admin mengoreksi jawaban AI.
- **FR8:** Rating jawaban AI oleh jamaah.
- **FR9:** Slider otonomi AI.
- **FR10:** Disclaimer otomatis AI.
- **FR11:** Upload PDF ke Knowledge Inbox.
- **FR12:** Persetujuan manual dokumen.
- **FR13:** Indikator status pemrosesan file.
- **FR14:** Quick Knowledge Snippets (Textbox).
- **FR15:** Sitasi sumber (Citation).
- **FR16:** Auto-tagging media per event.
- **FR17:** Auto-compression media.
- **FR18:** Watermarking opsional.
- **FR19:** Shadow ID via HMAC-SHA256.
- **FR20:** Audit log append-only.
- **FR21:** Super Admin Panic Button.
- **FR22:** Eskalasi ke admin manusia.
- **FR23:** Purge Knowledge.
- **FR24:** CMS Publish Artikel.
- **FR25:** Smart Blocks (Ayat/Hadits).
- **FR26:** Puzzle Page Builder.
- **FR27:** Design Guard (Lock colors/fonts).

### NonFunctional Requirements
- **NFR1:** Streaming Latency < 1s.
- **NFR2:** Enkripsi AES-256 & TLS 1.3.
- **NFR3:** Uptime 99.9%.
- **NFR4:** WCAG 2.1 Level AA.
- **NFR5:** Unix Timestamps (ms) Standard.

### Additional Requirements
- **AI Integration:** Gemini 2.5 Flash Lite (Files API).
- **Media Storage:** Cloudinary Free Tier.
- **Architecture:** Stateless AI Logic & Feature-based Hooks.

## Epic List

1. **Epic 1: Intelligent Communication Hub** (Chat & AI Core)
2. **Epic 2: Mosque Knowledge Base** (Knowledge Management)
3. **Epic 3: Puzzle Page Builder** (Visual Presence)
4. **Epic 4: Smart CMS & Blog** (Integrated Content)
5. **Epic 5: Media & Operational Transparency** (Assets & Finance)

---

## Epic 1: Intelligent Communication Hub
**Goal:** Pondasi interaksi jamaah-masjid yang privat dan aman.

### Story 1.1: Dasar Infrastruktur Chat & Shadow ID
As a Jamaah, I want memulai sesi chat secara anonim, So that saya merasa aman berkonsultasi.
**AC:** Given portal dibuka, When tombol anonim aktif & kirim pesan, Then sistem generate shadowId via HMAC-SHA256 & salt unik per sesi.

### Story 1.2: Pengiriman Pesan & Streaming AI (SSE)
As a Jamaah, I want mendapatkan respon streaming kata-demi-kata dari AI, So that respon terasa instan.
**AC:** Given chat aktif, When pesan dikirim, Then sistem memicu Gemini via AI-logic worker & kirim balik via SSE (First token < 1s).

### Story 1.3: Shared Admin Inbox
As a Admin DKM, I want melihat dan membalas chat dari dashboard, So that koordinasi teratur.
**AC:** Given admin login, When menu Inbox dibuka, Then sistem menampilkan daftar ChatSession aktif (multi-tenant isolated).

### Story 1.6: Chat Session Persistence
As a Jamaah, I want riwayat chat tidak hilang saat refresh, So that saya bisa lanjut bertanya.
**AC:** Given sesi aktif, When halaman di-refresh, Then sistem menarik riwayat pesan dari ChatMessageEntity berdasarkan sessionId.

---

## Epic 2: Mosque Knowledge Base
**Goal:** Manajemen basis pengetahuan masjid untuk melatih AI.

### Story 2.1: Knowledge Inbox (Upload PDF)
As a Admin DKM, I want mengunggah file PDF laporan, So that AI bisa menjawab berdasarkan data riil.
**AC:** Given admin di Inbox, When file diunggah, Then sistem simpan fileUri dari Gemini Files API & set status "Processing".

### Story 2.2: Persetujuan Dokumen Manual
As a Admin, I want menyetujui dokumen sebelum diindeks AI, So that akurasi data terjaga.
**AC:** Given file "Ready", When admin klik Approve, Then file tersebut masuk ke context window AI untuk chat berikutnya.

### Story 2.3: Quick Knowledge Snippets (Textbox)
As a Admin, I want mengetik info singkat (zakat/info ramadhan) di textbox, So that AI tahu info dinamis tanpa upload PDF.
**AC:** Given dashboard AI, When teks diisi di snippets box & simpan, Then sistem simpan di KnowledgeSnippetEntity dengan prioritas tinggi.

---

## Epic 3: Puzzle Page Builder
**Goal:** Membangun portal masjid profesional berbasis blok.

### Story 3.1: Drag-and-Drop Page Builder
As a Admin, I want menyusun tata letak web dengan blok section, So that pembuatan portal sangat cepat.
**AC:** Given builder aktif, When blok ditarik ke kanvas, Then sistem simpan urutan & config di PageSectionEntity.

### Story 3.2: Design Guard (Theming)
As a Admin, I want pilihan warna dibatasi, So that web tetap cantik & profesional.
**AC:** Given editor dibuka, When memilih warna, Then sistem hanya menampilkan palet Emerald/Amber yang sudah dikunci.

---

## Epic 4: Smart CMS & Blog
**Goal:** Publikasi kajian terintegrasi data masjid.

### Story 4.1: CMS dengan Smart Blocks (Ayat/Hadits)
As a Ustadz, I want menyisipkan teks Arab Ayat secara otomatis, So that penulisan kajian lebih akurat.
**AC:** Given editor blog, When ketik "/ayat", Then sistem cari referensi via AI/API & sisipkan teks asli Al-Quran.

---

## Epic 5: Media & Operational Transparency
**Goal:** Otomasi manajemen media dan laporan finansial sosial.

### Story 5.2: Social-Ready Transparency (Infographics)
As a Admin DKM, I want generate infografis laporan kas satu klik, So that mudah share ke WhatsApp.
**AC:** Given modul Finance, When klik "Share Infographic", Then sistem convert data saldo/transaksi menjadi gambar (Cloudinary transformation).

### Story 5.3: Super Admin Panic Button & Governance
As a Super Admin, I want mematikan AI per tenant, So that platform tetap aman dari penyalahgunaan.
**AC:** Given panel kontrol global, When tenant dinonaktifkan AI-nya, Then rute chat di tenant tersebut otomatis mengalihkan ke mode manual.
