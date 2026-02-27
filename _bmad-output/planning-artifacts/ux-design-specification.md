---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments: [
  '_bmad-output/planning-artifacts/prd.md',
  '_bmad-output/project-context.md',
  'docs/index.md',
  'docs/ui-component-inventory-frontend.md'
]
status: 'complete'
---

# UX Design Specification - MasjidHub "Smart Masjid" Platform

**Author:** Juragan
**Date:** 2026-02-23

---

## Executive Summary

### Project Vision
Mewujudkan "Otak Masjid Digital" yang responsif 24/7 dan beradab melalui integrasi CMS, Page Builder, Media Library, dan Chat AI dalam satu platform SaaS terpadu.

### Target Users
- **Jamaah:** Mencari info instan, membaca kajian, dan konsultasi pribadi yang aman.
- **Pengurus (DKM/Ustadz):** Membutuhkan alat bantu produksi konten dan jawaban otomatis yang efisien.

## Core User Experience

### Defining Experience
**"Simplicity in Creation & Interaction."** Kemampuan masjid untuk membangun kehadiran digital yang profesional dan responsif tanpa hambatan teknis.

### Platform Strategy
- **Public Portal:** Mobile-first (Optimasi jari satu tangan).
- **Dashboard:** Desktop-focused (Manajemen konten dan data padat).

## Visual Design Foundation

- **Palette:** Emerald (#10b981) & Amber (#f59e0b) dengan aksen AI **Cyan (#06b6d4)**.
- **Style:** **"The Warm Sanctuary"** (Sudut extra rounded, tipografi Inter/Geist 16px+, desain inklusif lansia).

## Extended Features UX Design

### 1. Smart CMS & Blog
- **Interface:** Minimalis Zen-mode editor.
- **Smart Blocks:** In-editor palette untuk menyisipkan Ayat Al-Quran, Hadits, dan widget donasi real-time.
- **UX Goal:** Menghilangkan proses copy-paste manual data masjid.

### 2. Puzzle Page Builder
- **Interaction:** Drag-and-drop section-based builder.
- **Design Guard:** Penguncian tema warna dan tipografi secara otomatis untuk menjaga estetika profesional organisasi.
- **Preview:** Live responsive toggle (Mobile/Desktop view).

### 3. Advanced Media Library
- **Automation:** Auto-tagging foto berdasarkan jadwal event.
- **Efficiency:** Background auto-compression (WebP) saat upload.
- **Branding:** Aesthetic Watermark yang opsional dan cerdas penempatannya.

### 4. Intelligent Engagement (Chat AI)
- **Mechanics:** Streaming chat dengan sitasi sumber dokumen (citation).
- **Anonymity:** "Shadow ID" visual untuk menjamin privasi jamaah.
- **Handover:** Transisi santun dari AI ke Admin manusia saat pertanyaan kompleks.

---

## Component Strategy

- **UI Primitives:** shadcn/ui (Radix + Tailwind).
- **Custom Components:** `ChatWindow`, `SmartBlockPalette`, `PuzzleSidebar`, `KnowledgeInboxTable`, `AnonymityToggle`.

## UX Consistency Patterns

- **Buttons:** Primary (Emerald), AI (Cyan), Danger (Rose).
- **Feedback:** Toast notifications (Sonner), AI Streaming Pulse, dan Modal Konfirmasi Destruktif.
- **Onboarding:** Default sapaan islami dan FAQ Quick-buttons di chat pertama.

## Responsive Design & Accessibility

- **Standard:** WCAG 2.1 Level AA.
- **Touch Targets:** Minimal 44x44px.
- **Typography:** Responsive scaling berbasis `rem` unit.
