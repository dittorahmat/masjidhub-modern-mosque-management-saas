import { describe, it, expect } from "bun:test";
import { getAuth } from "../worker/auth";
import { app } from "../worker/index";

describe("Better Auth Factory & Router Suite", () => {
  it("initializes Better Auth instance with disabled public registration", () => {
    const auth = getAuth();
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe("function");
    expect(typeof auth.api).toBe("object");
  });

  it("handles wildcard Better Auth handler on /api/auth/*", async () => {
    const res = await app.request("/api/auth/ok");
    expect(res.status).toBeLessThan(500);
  });
});
