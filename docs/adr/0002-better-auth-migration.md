# 0002: Better Auth Migration with Dual-Runtime & Disabled Public Registration

## Status
Accepted

## Context
MasjidHub previously used a bespoke cryptographic session token generator (`crypto-utils.ts`) attached to an ad-hoc `/api/auth/login` endpoint. While functional for early prototypes, it lacked standardized session invalidation, account provider abstraction (OAuth/SSO readiness), structured session expiry rotation, and battle-tested session storage security.

Furthermore, MasjidHub is an institutional SaaS platform for mosques. Congregants and administrators join via invite, staff onboarding by DKM Admins, or verified mosque onboarding (`/api/auth/register-mosque`). Open public self-registration (`signUp`) without tenant assignment is explicitly forbidden to prevent unassigned or rogue accounts.

The platform operates across two distinct persistence environments:
1. Cloudflare Workers at the Edge (using `drizzle-orm/d1` via `c.env.DB`).
2. Standalone VPS / local environments (using `better-sqlite3`).

## Decision
1. **Adopt Better Auth (`better-auth`)** as the core authentication framework for session, account, and identity lifecycle.
2. **Disable Public Registration**: Set `emailPassword.enabled: true` with public sign-up disabled (`signUp.enabled: false` or guarded hook) so that credentials cannot be registered arbitrarily via public endpoints. Mosque creation (`/api/auth/register-mosque`) and staff invitations serve as the sole onboarding conduits.
3. **Dual-Runtime Dynamic Factory (`getAuth(env)`)**: Instantiate Better Auth lazily per request using Drizzle ORM connected to either the Cloudflare D1 database instance or SQLite fallback via `getDb(env)`.
4. **Preserve Domain Multi-Tenancy**: Maintain MasjidHub's existing `tenants` and `users` relational structure. Expand `users` table with Better Auth fields (`emailVerified`, `image`) and add standard `sessions`, `accounts`, and `verifications` tables via Drizzle ORM.
5. **Hybrid Session Transport**: Support both secure HTTP-only cookies for dashboard web browsers and `Authorization: Bearer <token>` fallback for mobile scanners and TV kiosk mode.
6. **State Synchronization**: Bridge Better Auth client session events to Zustand `useAuthStore` in the React frontend, preserving 100% backward compatibility for existing UI components.

## Consequences
- **Positive**: Standardized session revocation, multi-device management, secure cookies, and future-proof OAuth readiness.
- **Positive**: Strict access boundary preventing unauthorized account creation outside tenant workflows.
- **Negative**: Requires maintaining dynamic factory instantiation in Edge worker request contexts.
