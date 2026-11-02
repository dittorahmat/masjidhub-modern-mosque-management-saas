import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { getDb, schema } from "./db";
import type { Env } from "./core-utils";

/**
 * Returns a configured Better Auth instance for the given environment context.
 * Supports dynamic factory binding across Cloudflare Workers (D1) and Node/Bun SQLite.
 *
 * Enforces institutional SaaS boundaries:
 * - Public self-registration without a mosque is DISABLED (signUp disabled).
 * - Registration occurs strictly via /api/auth/register-mosque or DKM invitations.
 */
export function getAuth(env?: Env) {
  const db = getDb(env);
  const isProd = env?.ENVIRONMENT === "production";
  const defaultDevSecret = "masjidhub_default_secret_salt_2025_betterauth";

  if (isProd && (!env?.INTERNAL_SECRET_KEY || env.INTERNAL_SECRET_KEY === defaultDevSecret)) {
    console.error("[FATAL SECURITY] INTERNAL_SECRET_KEY must be explicitly set with high entropy in production.");
  }

  const secret = env?.INTERNAL_SECRET_KEY || defaultDevSecret;
  const baseURL = env?.PUBLIC_URL || "http://localhost:3000";

  return betterAuth({
    database: drizzleAdapter(db as any, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret,
    baseURL,
    plugins: [bearer()],
    advanced: {
      useSecureCookies: isProd, // Enforce Secure cookies in production, allow plain cookies on dev/localhost
    },
    emailAndPassword: {
      enabled: true,
      // Public self-registration is explicitly disabled
      disableSignUp: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "jamaah",
        },
        tenantId: {
          type: "string",
          required: false,
        },
        tenantIds: {
          type: "string",
          required: false,
        },
        phone: {
          type: "string",
          required: false,
        },
        avatarUrl: {
          type: "string",
          required: false,
        },
        isActive: {
          type: "boolean",
          required: false,
          defaultValue: true,
        },
        isBanned: {
          type: "boolean",
          required: false,
          defaultValue: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}

export type AuthInstance = ReturnType<typeof getAuth>;
