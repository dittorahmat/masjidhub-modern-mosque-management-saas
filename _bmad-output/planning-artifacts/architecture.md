---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: [
  '_bmad-output/planning-artifacts/prd.md',
  '_bmad-output/planning-artifacts/ux-design-specification.md',
  '_bmad-output/project-context.md',
  'docs/architecture-backend.md',
  'docs/architecture-frontend.md',
  'docs/index.md'
]
workflowType: 'architecture'
project_name: 'masjidhub-modern-mosque-management-saas'
user_name: 'Juragan'
date: '2026-02-23'
status: 'complete'
---

# Architecture Decision Document - MasjidHub "Smart Masjid"

_This document contains the final architectural decisions for the implementation of CMS, Page Builder, Media Library, and AI Engagement features._

---

## 1. Project Context Analysis

### Technical Constraints & Dependencies
- **Runtime:** Cloudflare Workers (Hono).
- **Primary Database:** Durable Objects (IndexedEntity abstraction).
- **AI Engine:** Gemini 2.5 Flash Lite (Native Long-Context via Files API).
- **Media Storage:** Cloudinary (Free Tier) for storage, auto-compression, and dynamic watermarking.

---

## 2. Core Architectural Decisions

### Data Architecture
- **Multi-tenant Isolation:** Absolute data separation using `tenantId` on every record.
- **Embedded Metadata:** Chat metadata (Citations & Cards) stored as embedded JSON inside messages for < 500ms read performance.
- **Constraints:** Max 3 cards and 5 citations per message to maintain Durable Object efficiency (128KB limit).

### AI & Integration Patterns
- **Files API Pipe:** PDF documents are uploaded to Gemini Files API; only `fileUri` is stored in Durable Objects.
- **Zero-RAG Strategy:** Leveraging Gemini's 1M+ context window for document understanding.
- **Cloudinary Pipe:** Worker-side orchestration for media uploads and dynamic URL generation (`f_auto,q_auto`).

### Security & Privacy (Shadow ID)
- **Mechanism:** HMAC-SHA256 using `INTERNAL_SECRET_KEY` + `userId` + `sessionSalt`.
- **Ephemeral Salts:** Salts are generated per session and deleted upon session closure/expiry (Burn-on-completion).
- **Audit Integrity:** Interaction logs are append-only and immutable for tenant admins.

### Communication Protocols
- **Real-time:** Durable Objects WebSockets for low-latency chat.
- **Streaming:** Server-Sent Events (SSE) via Hono `streamText` for Gemini responses.

---

## 3. Implementation Patterns & Consistency Rules

- **Date Standard:** Unix Timestamps (milliseconds) exclusively for DB, API, and State.
- **Naming:** PascalCase for Classes, camelCase for Properties/JSON, kebab-case for Files/Endpoints.
- **Logic Separation:** 
    - `worker/ai-logic.ts`: Stateless AI orchestration.
    - `src/hooks/features/`: Complex frontend logic.
- **Null Handling:** Use explicit `null` for empty data; avoid `undefined` in persistence.

---

## 4. Project Structure & Boundaries

```text
masjidhub-saas/
├── shared/types.ts           # Extended with BlogPost, Media, Chat interfaces
├── src/
│   ├── components/features/  # ai/, cms/, builder/, media/
│   ├── hooks/features/       # useChatStreaming, usePuzzleBuilder
│   └── lib/api-client.ts     # SSE implementation
├── worker/
│   ├── ai-logic.ts           # Gemini orchestration logic
│   ├── entities.ts           # 6 new IndexedEntity definitions
│   ├── user-routes.ts        # Integrated routes for all new modules
│   └── cloudinary.ts         # Asset management helpers
└── public/assets/puzzle/     # Builder section thumbnails
```

---

## 5. Detailed Entity Schemas (Durable Objects)

1. **BlogPost:** `id`, `tenantId`, `slug`, `title`, `content`, `status`, `timestamps`.
2. **MediaItem:** `id`, `tenantId`, `cloudinaryUrl`, `eventTag` (nullable), `timestamps`.
3. **PageSection:** `id`, `tenantId`, `type`, `order`, `config` (validated JSON), `isVisible`.
4. **KnowledgeSnippet:** `id`, `tenantId`, `content`, `priority`, `expirationDate`.
5. **ChatSession:** `id`, `tenantId`, `userId`, `isAnonymous`, `sessionSalt` (protected).
6. **ChatMessage:** `id`, `sessionId`, `tenantId`, `senderRole`, `text`, `metadata` (JSON), `timestamp`.

---

## 6. Architecture Readiness Assessment

**Status:** READY FOR IMPLEMENTATION
**Confidence:** High
**Key Strength:** Low TCO infrastructure with high-security multi-tenant isolation.

**AI Agent Guideline:** Refer to this document for all naming and structural decisions. Priority #1 is implementing the new entities in `worker/entities.ts`.
