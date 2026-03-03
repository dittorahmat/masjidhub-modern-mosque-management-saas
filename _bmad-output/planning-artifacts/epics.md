---
stepsCompleted: [step-01-init, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: [
  '_bmad-output/planning-artifacts/prd.md',
  '_bmad-output/planning-artifacts/architecture.md',
  '_bmad-output/planning-artifacts/ux-design-specification.md',
  '_bmad-output/brainstorming/brainstorming-session-2026-03-02-bank-parser.md',
  '_bmad-output/brainstorming/brainstorming-session-2026-03-03.md'
]
workflowType: 'architecture'
lastStep: 4
status: 'complete'
---

# masjidhub-modern-mosque-management-saas - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for masjidhub-modern-mosque-management-saas, decomposing the requirements into implementable stories.

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
- **FR28:** AI-Powered Bank Statement Parser (Bulk Import).
- **FR29:** Atomic Transaction Fingerprinting for deduplication.
- **FR30:** Auto-Loyalty Detection for recurring donors.
- **FR31 (NEW):** Automatic Prayer Schedule via City Geocoding.
- **FR32 (NEW):** Iqomah Countdown & Silent Sanctuary Mode for Kiosk.
- **FR33 (NEW):** Respectful Override Logic for prayer data.

### NonFunctional Requirements
- **NFR1:** Streaming Latency < 1s.
- **NFR2:** Enkripsi AES-256 & TLS 1.3.
- **NFR3:** Uptime 99.9%.
- **NFR4:** WCAG 2.1 Level AA.
- **NFR5:** Unix Timestamps (ms) Standard.

### Additional Requirements
- **AI Integration:** Gemini 2.5 Flash Lite (Files API / Vision).
- **Media Storage:** Cloudinary Free Tier.
- **Architecture:** Stateless AI Logic & Feature-based Hooks.

## Epic List

1. **Epic 1: Intelligent Communication Hub** (Chat & AI Core) [DONE]
2. **Epic 2: Mosque Knowledge Base** (Knowledge Management) [DONE]
3. **Epic 3: Puzzle Page Builder** (Visual Presence) [DONE]
4. **Epic 4: Smart CMS & Blog** (Integrated Content) [DONE]
5. **Epic 5: Media & Operational Transparency** (Assets & Finance) [DONE]
6. **Epic 6: AI Persona & Role Management** (Identity & Customization) [DONE]
7. **Epic 7: AI Financial Intelligence** (Statement Parser) [DONE]
8. **Epic 8: Smart Prayer Schedule Hub** (Otomasi Ibadah) [DONE]

---

## Epic 8: Smart Prayer Schedule Hub
**Goal:** Mengotomatiskan jadwal shalat berbasis lokasi untuk kemudahan operasional DKM dan aksesibilitas jamaah.

### Story 8.1: Automatic Location Setup
**As a** Admin DKM, I want mengatur lokasi masjid cukup dengan mengetik nama kota, So that saya tidak perlu mencari koordinat manual.
**AC:** Given halaman Settings, When admin mengetik nama kota, Then sistem lookup via Geocoding API & simpan koordinat/zona waktu.

### Story 8.2: 30-Day Automated Prayer Sync & Cache
**As a** Admin DKM, I want jadwal shalat tersinkronisasi otomatis setiap bulan, So that informasi selalu akurat tanpa input manual.
**AC:** Given koordinat valid, When sinkronisasi bulanan dipicu, Then sistem tarik data 30 hari dari API (Kemenag standard) ke Durable Objects.

### Story 8.3: The Respectful Override (Hybrid)
**As a** Admin DKM, I want bisa mengedit jadwal atau petugas secara manual tanpa ditimpa sistem otomatis, So that kendali tetap di tangan pengurus.
**AC:** Given jadwal di dashboard, When admin edit manual, Then sistem set flag `"Locked`" agar data tidak ditimpa sinkronisasi otomatis.

### Story 8.4: Interactive Kiosk & Portal Presence
**As a** Jamaah, I want melihat countdown Iqomah dan tampilan layar yang tenang saat shalat, So that saya bisa beribadah dengan lebih khusyuk.
**AC:** Given Kiosk aktif, When waktu adzan tiba, Then muncul countdown Iqomah. When waktu shalat tiba, Then layar meredup (`"Silent Mode`").
