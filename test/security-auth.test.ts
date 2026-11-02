import { describe, it, expect } from "bun:test";
import { app } from "../worker/index";

describe("Security Hardening & Role Authorization Suite", () => {
  it("protects /api/super/* endpoints against unauthenticated access", async () => {
    const res = await app.fetch(new Request("http://localhost/api/super/summary"));
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.success).toBe(false);
  });

  it("rejects non-superadmin users from /api/super/* endpoints with 403", async () => {
    const res = await app.fetch(new Request("http://localhost/api/super/summary", {
      headers: { Authorization: "Bearer demo-dkm@masjid.org" }
    }));
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("superadmin_platform");
  });

  it("permits platform superadmin to access /api/super/* endpoints", async () => {
    const res = await app.fetch(new Request("http://localhost/api/super/summary", {
      headers: { Authorization: "Bearer admin@masjidhub.com" }
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
    const res = await app.fetch(new Request("http://localhost/api/al-hikmah/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer demo-jamaah@masjid.org"
      },
      body: JSON.stringify({ name: "Tampered Name" })
    }));
    expect(res.status).toBe(403);
  });

  it("permits authorized DKM Admin to update tenant settings", async () => {
    const res = await app.fetch(new Request("http://localhost/api/al-hikmah/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer demo-dkm@masjid.org"
      },
      body: JSON.stringify({ bio: "Verified DKM Admin bio update" })
    }));
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.bio).toBe("Verified DKM Admin bio update");
  });

  it("requires authentication token on GET /api/auth/me", async () => {
    const resAnon = await app.fetch(new Request("http://localhost/api/auth/me?email=admin@masjidhub.com"));
    expect(resAnon.status).toBe(401);

    const resAuth = await app.fetch(new Request("http://localhost/api/auth/me", {
      headers: { Authorization: "Bearer admin@masjidhub.com" }
    }));
    expect(resAuth.status).toBe(200);
    const body: any = await resAuth.json();
    expect(body.data.user.email).toBe("admin@masjidhub.com");
  });

  it("blocks directory traversal on local storage reads and uploads", async () => {
    const resGet = await app.fetch(new Request("http://localhost/api/storage/..%2Fpackage.json"));
    expect(resGet.status).toBe(404);

    const resUpload = await app.fetch(new Request("http://localhost/api/upload?key=..%2Fhack.txt", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "malicious"
    }));
    expect(resUpload.status).toBe(400);
  });
});
