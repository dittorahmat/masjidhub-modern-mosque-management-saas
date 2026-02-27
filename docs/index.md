# MasjidHub Project Documentation Index

_This is the primary entry point for AI-assisted development and documentation for the MasjidHub Modern Mosque Management SaaS project._

---

## Project Overview

- **Repository Type:** Multi-part (Frontend + Backend + Shared)
- **Primary Language:** TypeScript 5.8
- **Architecture:** Feature-Sliced Design (Frontend) & Layered Durable Objects (Backend)

---

## Quick Reference

### Frontend (`src/`)
- **Type:** Web (React 18 + Vite 6)
- **Tech Stack:** Tailwind CSS, shadcn/ui, Zustand, TanStack Query.
- **Root:** `src/`
- **Documentation:** [Architecture - Frontend](./architecture-frontend.md)

### Backend (`worker/`)
- **Type:** Backend (Cloudflare Workers + Hono)
- **Tech Stack:** Durable Objects (SQLite), TypeScript, Zod.
- **Root:** `worker/`
- **Documentation:** [Architecture - Backend](./architecture-backend.md)

### Shared (`shared/`)
- **Type:** Library (Shared Types & Data)
- **Tech Stack:** TypeScript ES2023.
- **Root:** `shared/`
- **Documentation:** [Data Models - Backend](./data-models-backend.md)

---

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture - Frontend](./architecture-frontend.md)
- [Architecture - Backend](./architecture-backend.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Integration Architecture](./integration-architecture.md)
- [API Contracts - Backend](./api-contracts-backend.md)
- [Data Models - Backend](./data-models-backend.md)
- [UI Component Inventory - Frontend](./ui-component-inventory-frontend.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

---

## Existing Documentation

- [README.md](../README.md) - Main project documentation.
- [FSD.md](../fsd.md) - Feature-Sliced Design architecture overview.
- [DEMO_TESTING.md](../DEMO_TESTING.md) - Testing guide for demo system.
- [Project Context](../_bmad-output/project-context.md) - Critical rules for AI implementation.

---

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**: `bun install`
3.  **Run development server**: `bun run dev`
4.  **Access demo mode**: Navigate to `/login?demo=true`
5.  **Deploy to Cloudflare**: `bun run deploy`

---

Last Updated: 2026-02-23
