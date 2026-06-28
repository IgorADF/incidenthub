import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  runFinalTestConfigs,
  runInitTestConfigs,
} from "./helpers/run-test-config";
import { uniqueEmail, uniqueName } from "./helpers/seed";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

let app: FastifyZodInstance;

describe("organization routes (e2e)", () => {
  beforeAll(async () => {
    app = await runInitTestConfigs();
  });

  afterAll(async () => {
    await runFinalTestConfigs();
  });

  describe("POST /organizations", () => {
    it("should create an organization and an admin user", async () => {
      const email = uniqueEmail();
      const name = uniqueName("Org");

      const response = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name },
          user: { name: "Admin User", email, password: "password123" },
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json().data;
      expect(body.organization).toEqual(
        expect.objectContaining({ name }),
      );
      expect(body.organization.id).toEqual(expect.any(String));
      expect(body.user).toEqual(
        expect.objectContaining({
          email,
          name: "Admin User",
          type: "ADMIN",
          organizationId: body.organization.id,
        }),
      );
      expect(body.user).not.toHaveProperty("password");
    });

    it("should return 409 when the organization name already exists", async () => {
      const email = uniqueEmail();
      const name = uniqueName("Org");

      const first = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name },
          user: { name: "Admin User", email, password: "password123" },
        },
      });
      expect(first.statusCode).toBe(201);

      const response = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name },
          user: {
            name: "Another User",
            email: uniqueEmail(),
            password: "password123",
          },
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "EntityAlreadyExists",
          context: { entity: "organization", field: "name" },
        }),
      );
    });

    it("should return 409 when the user email already exists", async () => {
      const email = uniqueEmail();
      const name = uniqueName("Org");

      const first = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name },
          user: { name: "Admin User", email, password: "password123" },
        },
      });
      expect(first.statusCode).toBe(201);

      const response = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name: uniqueName("Org") },
          user: {
            name: "Another User",
            email,
            password: "password123",
          },
        },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual(
        expect.objectContaining({
          code: "EntityAlreadyExists",
          context: { entity: "user", field: "email" },
        }),
      );
    });

    it("should return 400 when the body is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/organizations",
        payload: {
          organization: { name: uniqueName("Org") },
          user: {
            name: "Admin User",
            email: uniqueEmail(),
            password: "short",
          },
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("VALIDATION_ERROR");
    });
  });
});
