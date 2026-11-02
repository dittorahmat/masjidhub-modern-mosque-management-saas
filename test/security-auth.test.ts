import { describe, it, expect } from "bun:test";
import { app } from "../worker/index";
import { getStorage } from "../worker/storage/index";
import { createSessionToken } from "../worker/crypto-utils";

describe("Security Hardening & Role Authorization Suite", () => {
  const secret = "masjidhub_default_secret_salt_2025";

  it("protects /api/super/* endpoints against unauthenticated access", async () => {
    const res = await app.fetch(new Request("http://localhost/api/super/summary"));
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it("rejects non-superadmin users from /api/super/* endpoints with 403", async () => {
    const dkmToken = await createSessionToken("u2", secret);
    const res = await app.fetch(new Request("http://localhost/api/super/summary", {
      headers: { Authorization: `Bearer ${dkmToken}` }
    }));
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("superadmin_platform");
  });

  it("permits platform superadmin to access /api/super/* endpoints", async () => {
    const superToken = await createSessionToken("u1", secret);
    const res = await app.fetch(new Request("http://localhost/api/super/summary", {
      headers: { Authorization: `Bearer ${superToken}` }
    }));
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalTenants).toBeGreaterThan(0);
  });

  it("protects PUT /api/:slug/settings from unauthenticated tampering", async () => {
    const res = await app.fetch(new Request("http://localhost/api/al-hikmah/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tampered Name" })
    }));
    expect(res.status).toBe(401);
  });

  it("rejects unaffiliated users from mutating tenant settings with 403", async () => {
    const jamaahToken = await createSessionToken("u5", secret);
    const res = await app.fetch(new Request("http://localhost/api/al-hikmah/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jamaahToken}`
      },
      body: JSON.stringify({ name: "Tampered Name" })
    }));
    expect(res.status).toBe(403);
  });

  it("permits authorized DKM Admin to update tenant settings", async () => {
    const dkmToken = await createSessionToken("u2", secret);
    const res = await app.fetch(new Request("http://localhost/api/al-hikmah/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dkmToken}`
      },
      body: JSON.stringify({ bio: "Verified DKM Admin bio update" })
    }));
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bio).toBe("Verified DKM Admin bio update");
  });

  it("requires signed session token on GET /api/auth/me and blocks forged headers", async () => {
    // 1. Anonymous request
    const resAnon = await app.fetch(new Request("http://localhost/api/auth/me?email=admin@masjidhub.com"));
    expect(resAnon.status).toBe(401);

    // 2. Forged fake token
    const resForged = await app.fetch(new Request("http://localhost/api/auth/me", {
      headers: { Authorization: "Bearer forged.invalid.token" }
    }));
    expect(resForged.status).toBe(401);

    // 3. Valid signed token from login
    const loginRes = await app.fetch(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@masjidhub.com" })
    }));
    const loginData: any = await loginRes.json();
    expect(loginData.data.token).toBeDefined();

    const resAuth = await app.fetch(new Request("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${loginData.data.token}` }
    }));
    expect(resAuth.status).toBe(200);
    const body: any = await resAuth.json();
    expect(body.data.user.email).toBe("admin@masjidhub.com");
  });

  it("blocks directory traversal on local storage reads and uploads while permitting valid ops", async () => {
    // 1. Path traversal read blocked
    const resGet = await app.fetch(new Request("http://localhost/api/storage/..%2Fpackage.json"));
    expect(resGet.status).toBe(404);

    // 2. Path traversal upload blocked
    const resUpload = await app.fetch(new Request("http://localhost/api/upload?key=..%2Fhack.txt", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "malicious"
    }));
    expect(resUpload.status).toBe(400);

    // 3. Legitimate storage write & read
    const storage = getStorage();
    const testKey = `test-${Date.now()}.txt`;
    const encoder = new TextEncoder();
    const putRes = await storage.put(testKey, encoder.encode("legitimate data"));
    expect(putRes.key).toBe(testKey);

    const getRes = await storage.get(testKey);
    expect(getRes).not.toBeNull();

    const delRes = await storage.delete(testKey);
    expect(delRes).toBe(true);

    // 4. Traversal delete safely returns false
    const delTraversal = await storage.delete("../outside.txt");
    expect(delTraversal).toBe(false);
  });
});
