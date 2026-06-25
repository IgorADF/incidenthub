import { describe, expect, it } from "vitest";
import { createE2EServer } from "./helpers/superserver";
import { createOrganization, login } from "./helpers/flows";

describe("organization and auth routes (e2e)", () => {
  it("should create an organization and authenticate the admin user", async () => {
    const server = await createE2EServer(import.meta.url);

    try {
      const created = await createOrganization(server);

      expect(created.statusCode).toBe(201);
      expect(created.body.data.organization.name).toBe("Acme Corp");
      expect(created.body.data.user.email).toBe("admin@acme.com");
      expect(created.body.data.user).not.toHaveProperty("password");

      const authenticated = await login(server, {
        email: "admin@acme.com",
        password: "secret123",
      });

      expect(authenticated.statusCode).toBe(200);
      expect(authenticated.body.data.token).toEqual(expect.any(String));
      expect(authenticated.body.data.user.email).toBe("admin@acme.com");
      expect(authenticated.body.data.user).not.toHaveProperty("password");
    } finally {
      await server.close();
    }
  });
});
