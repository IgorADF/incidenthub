import { describe, expect, it } from "vitest";
import { createE2EServer } from "./helpers/superserver";
import { createOrganizationAndLogin, login } from "./helpers/flows";

describe("user routes (e2e)", () => {
  it("should let an admin create a user and reject user creation by a dev", async () => {
    const server = await createE2EServer(import.meta.url);

    try {
      const { token } = await createOrganizationAndLogin(server);

      const created = await server.post(
        "/users",
        {
          name: "Developer User",
          email: "dev@acme.com",
          password: "secret123",
          type: "DEV",
        },
        token,
      );

      expect(created.statusCode).toBe(201);
      expect(created.body.data.user).toEqual(
        expect.objectContaining({
          email: "dev@acme.com",
          type: "DEV",
        }),
      );
      expect(created.body.data.user).not.toHaveProperty("password");

      const authenticatedDev = await login(server, {
        email: "dev@acme.com",
        password: "secret123",
      });

      expect(authenticatedDev.statusCode).toBe(200);

      const forbidden = await server.post(
        "/users",
        {
          name: "Another User",
          email: "another@acme.com",
          password: "secret123",
          type: "DEV",
        },
        authenticatedDev.body.data.token,
      );

      expect(forbidden.statusCode).toBe(403);
    } finally {
      await server.close();
    }
  });
});
