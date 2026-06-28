import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
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
				headers: authHeader(admin.token),
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
				headers: authHeader(admin.token),
				payload: { enable: false },
			});

			const response = await app.inject({
				method: "PATCH",
				url: `/services/${serviceId}/enabled`,
				headers: authHeader(admin.token),
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
				headers: authHeader(admin.token),
				payload: { enable: false },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 401 without an Authorization header", async () => {
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
				headers: authHeader(admin.token),
				payload: { enable: false },
			});

			const newName = uniqueName("Updated Service");
			const response = await app.inject({
				method: "PUT",
				url: `/services/${serviceId}`,
				headers: authHeader(admin.token),
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
				headers: authHeader(admin.token),
				payload: { name: uniqueName("Should Fail") },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 401 without an Authorization header", async () => {
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
				headers: authHeader(admin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({ deleted: true });
		});

		it("should return 404 when the service does not exist", async () => {
			const response = await app.inject({
				method: "DELETE",
				url: `/services/${randomUUID()}`,
				headers: authHeader(admin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 401 without an Authorization header", async () => {
			const { serviceId } = await seedService(app, admin.token, projectId);

			const response = await app.inject({
				method: "DELETE",
				url: `/services/${serviceId}`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});
	});
});
