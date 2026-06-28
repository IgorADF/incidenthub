import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  runFinalTestConfigs,
  runInitTestConfigs,
} from "./helpers/run-test-config";
import { seedOrganizationAndAdmin } from "./helpers/seed";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

let app: FastifyZodInstance;
let admin: {
  token: string;
  email: string;
  password: string;
};

describe("auth routes (e2e)", () => {
  beforeAll(async () => {
    app = await runInitTestConfigs();
    admin = await seedOrganizationAndAdmin(app);
  });

  afterAll(async () => {
    await runFinalTestConfigs();
  });

  describe("POST /auth/login", () => {
    it("should return a token and the user with valid credentials", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: admin.email, password: admin.password },
      });

      expect(response.statusCode).toBe(200);

      const body = response.json().data;
      expect(body.token).toEqual(expect.any(String));
      expect(body.user).toEqual(
        expect.objectContaining({ email: admin.email, type: "ADMIN" }),
      );
      expect(body.user).not.toHaveProperty("password");
    });

    it("should return 401 with a wrong password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: admin.email, password: "wrong-password" },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("InvalidCredentialError");
    });

    it("should return 401 for an unknown email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: "does-not-exist@e2e.test",
          password: admin.password,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("InvalidCredentialError");
    });

    it("should return 400 when the body is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { email: "not-an-email" },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /password/forgot", () => {
    it("should return 200 with { sent: true } for an unknown email (no enumeration)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/password/forgot",
        payload: { email: "does-not-exist@e2e.test" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ sent: true });
    });

    it("should return 400 when the body is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/password/forgot",
        payload: { email: "not-an-email" },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("VALIDATION_ERROR");
    });
  });
});
