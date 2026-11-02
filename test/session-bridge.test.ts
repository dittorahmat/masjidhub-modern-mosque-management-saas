import { describe, it, expect } from "bun:test";
import { app } from "../worker/index";
import { getAuth } from "../worker/auth";

describe("Tenant & Demo Session Bridge Suite", () => {
  it("registers a mosque and returns user, tenant, and valid session", async () => {
    const slug = `masjid-test-${Date.now()}`;
    const res = await app.request("/api/auth/register-mosque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ahmad Admin",
        email: `admin-${Date.now()}@test.com`,
        mosqueName: "Masjid Raya Test",
        slug,
        address: "Jl. Merdeka No. 1",
      }),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user).toBeDefined();
    expect(data.data.tenant).toBeDefined();
    expect(data.data.token).toBeDefined();

    // Verify session was recorded in Better Auth
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${data.data.token}`,
      }),
    });
    expect(session).toBeDefined();
    expect(session?.user?.id).toBe(data.data.user.id);
  });

  it("handles demo-login endpoint and issues authentic Better Auth session", async () => {
    const res = await app.request("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "dkm_admin" }),
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.role).toBe("dkm_admin");
    expect(data.data.token).toBeDefined();

    // Verify session is verifiable via Better Auth API
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: new Headers({
        authorization: `Bearer ${data.data.token}`,
      }),
    });
    expect(session).toBeDefined();
    expect(session?.user?.id).toBe(data.data.user.id);
  });
});
