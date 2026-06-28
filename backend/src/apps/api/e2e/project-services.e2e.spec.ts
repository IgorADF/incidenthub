import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  runFinalTestConfigs,
  runInitTestConfigs,
} from "./helpers/run-test-config";
import {
  authHeader,
  seedOrganizationAndAdmin,
  seedProject,
  seedService,
  uniqueName,
} from "./helpers/seed";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

let app: FastifyZodInstance;
let admin: { token: string; organizationId: string };
let projectId: string;

describe("project-service routes (e2e)", () => {
  beforeAll(async () => {
    app = await runInitTestConfigs();
    admin = await seedOrganizationAndAdmin(app);
    ({ projectId } = await seedProject(app, admin.token));
  });

  afterAll(async () => {
    await runFinalTestConfigs();
  });

  describe("POST /projects/:projectId/services", () => {
    it("should create a service under the project", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/projects/${projectId}/services`,
        headers: authHeader(admin.token),
        payload: {
          name: uniqueName("Service"),
          url: "https://api.example.com/health",
          intervalSeconds: 60,
          timeoutSeconds: 10,
          expectedResponseStatus: 200,
          incidentDetectionFails: 3,
          emailToAlert: "ops@example.com",
        },
      });

      expect(response.statusCode).toBe(201);

      const service = response.json().data.service;
      expect(service).toEqual(
        expect.objectContaining({
          projectId,
          status: "CHECKING",
          enabled: true,
        }),
      );
      expect(service).not.toHaveProperty("consecutivesIncidentDetectionFails");
      expect(service).not.toHaveProperty("lastCheckedAt");
    });

    it("should return 404 when the project does not exist", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/projects/${randomUUID()}/services`,
        headers: authHeader(admin.token),
        payload: {
          name: uniqueName("Service"),
          url: "https://api.example.com/health",
          intervalSeconds: 60,
          timeoutSeconds: 10,
          expectedResponseStatus: 200,
          incidentDetectionFails: 3,
          emailToAlert: "ops@example.com",
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe("NotFoundError");
    });

    it("should return 400 when timeoutSeconds is not smaller than intervalSeconds", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/projects/${projectId}/services`,
        headers: authHeader(admin.token),
        payload: {
          name: uniqueName("Service"),
          url: "https://api.example.com/health",
          intervalSeconds: 10,
          timeoutSeconds: 10,
          expectedResponseStatus: 200,
          incidentDetectionFails: 3,
          emailToAlert: "ops@example.com",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe("ValidationEntitiesError");
    });

    it("should return 401 without an Authorization header", async () => {
      const response = await app.inject({
        method: "POST",
        url: `/projects/${projectId}/services`,
        payload: {
          name: uniqueName("Service"),
          url: "https://api.example.com/health",
          intervalSeconds: 60,
          timeoutSeconds: 10,
          expectedResponseStatus: 200,
          incidentDetectionFails: 3,
          emailToAlert: "ops@example.com",
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /projects/:projectId/services", () => {
    it("should list the services of the project", async () => {
      const { serviceId } = await seedService(app, admin.token, projectId);

      const response = await app.inject({
        method: "GET",
        url: `/projects/${projectId}/services`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(200);
      const services = response.json().data.services as Array<{ id: string }>;
      expect(services.some((s) => s.id === serviceId)).toBe(true);
    });

    it("should return 404 when the project does not exist", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/projects/${randomUUID()}/services`,
        headers: authHeader(admin.token),
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe("NotFoundError");
    });

    it("should return 401 without an Authorization header", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/projects/${projectId}/services`,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().code).toBe("UNAUTHORIZED");
    });
  });
});
