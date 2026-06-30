import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import {
	runFinalTestConfigs,
	runInitTestConfigs,
} from "./helpers/run-test-config";
import {
	authCookies,
	seedDevUserAndLogin,
	seedOrganizationAndAdmin,
	seedProject,
	seedService,
	uniqueName,
} from "./helpers/seed";

let app: FastifyZodInstance;
let admin: { token: string; organizationId: string };
let projectId: string;

describe("service routes (e2e)", () => {
	beforeAll(async () => {
		app = await runInitTestConfigs();
		admin = await seedOrganizationAndAdmin(app);
		({ projectId } = await seedProject(app, admin.token));
	});

	afterAll(async () => {
		await runFinalTestConfigs();
	});

	describe("PATCH /services/:serviceId/enabled", () => {
		it("should disable a service", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				...authCookies(admin.token),
				payload: { enable: false },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.service).toEqual(
				expect.objectContaining({
					id: serviceId,
					enabled: false,
					status: "DISABLED",
				}),
			);
		});

		it("should enable a service", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				...authCookies(admin.token),
				payload: { enable: false },
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				...authCookies(admin.token),
				payload: { enable: true },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.service).toEqual(
				expect.objectContaining({
					id: serviceId,
					enabled: true,
					status: "CHECKING",
				}),
			);
		});

		it("should return 404 when the service does not exist", async () => {
			const response = await app.inject({
				method: "PATCH",
				url: `/services/${randomUUID()}/enabled`,
				...authCookies(admin.token),
				payload: { enable: false },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 401 without a session cookie", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				payload: { enable: false },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});

	describe("PUT /services/:serviceId", () => {
		it("should update a disabled service", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				...authCookies(admin.token),
				payload: { enable: false },
			});

			const newName = uniqueName("Updated Service");
			const response = await app.inject({
				method: "PUT",
				url: `/services/${serviceId}`,
				...authCookies(admin.token),
				payload: { name: newName },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.service.name).toBe(newName);
		});

		it("should return 403 when updating an enabled service", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "PUT",
				url: `/services/${serviceId}`,
				...authCookies(admin.token),
				payload: { name: uniqueName("Should Fail") },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 401 without a session cookie", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "PUT",
				url: `/services/${serviceId}`,
				payload: { name: uniqueName("No Auth") },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});

	describe("DELETE /services/:serviceId", () => {
		it("should delete a service", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "DELETE",
				url: `/services/${serviceId}`,
				...authCookies(admin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({ deleted: true });
		});

		it("should return 404 when the service does not exist", async () => {
			const response = await app.inject({
				method: "DELETE",
				url: `/services/${randomUUID()}`,
				...authCookies(admin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 401 without a session cookie", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "DELETE",
				url: `/services/${serviceId}`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});

	describe("GET /services/:serviceId/health-checks", () => {
		it("should return 200 with an empty list and pagination structure when no health-checks exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/health-checks`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({
				healthChecks: [],
				pagination: {
					limit: 20,
					hasNextPage: false,
					nextCursor: { id: null },
				},
			});
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/health-checks`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await seedDevUserAndLogin(app, localAdmin.token);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/health-checks`,
				...authCookies(dev.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the service does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "GET",
				url: "/services/01940f8e-1f30-7c30-9a6f-1234567890ab/health-checks",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when the service belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, other.token);
			const { serviceId } = await seedService(app, other.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/health-checks`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should accept limit and id cursor query params", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/health-checks?limit=5`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.pagination.limit).toBe(5);
		});

		it("should return 400 when the serviceId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "GET",
				url: "/services/not-a-uuid/health-checks",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});
	});

	describe("GET /services/:serviceId/incidents", () => {
		it("should return 200 with an empty list and pagination structure when no incidents exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/incidents`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({
				incidents: [],
				pagination: {
					limit: 20,
					hasNextPage: false,
					nextCursor: { id: null },
				},
			});
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/incidents`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await seedDevUserAndLogin(app, localAdmin.token);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/incidents`,
				...authCookies(dev.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the service does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "GET",
				url: "/services/01940f8e-1f30-7c30-9a6f-1234567890ab/incidents",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when the service belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, other.token);
			const { serviceId } = await seedService(app, other.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/incidents`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should accept limit and id cursor query params", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const { projectId: pid } = await seedProject(app, localAdmin.token);
			const { serviceId } = await seedService(app, localAdmin.token, pid);

			const response = await app.inject({
				method: "GET",
				url: `/services/${serviceId}/incidents?limit=5`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.pagination.limit).toBe(5);
		});

		it("should return 400 when the serviceId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "GET",
				url: "/services/not-a-uuid/incidents",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});
	});
});
