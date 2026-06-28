import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import {
	runFinalTestConfigs,
	runInitTestConfigs,
} from "./helpers/run-test-config";
import {
	authHeader,
	seedDevUserAndLogin,
	seedOrganizationAndAdmin,
	uniqueEmail,
} from "./helpers/seed";

let app: FastifyZodInstance;
let admin: { token: string; organizationId: string };

describe("user routes (e2e)", () => {
	beforeAll(async () => {
		app = await runInitTestConfigs();
		admin = await seedOrganizationAndAdmin(app);
	});

	afterAll(async () => {
		await runFinalTestConfigs();
	});

	describe("POST /users", () => {
		it("should create a user within the caller's organization", async () => {
			const email = uniqueEmail();

			const response = await app.inject({
				method: "POST",
				url: "/users",
				headers: authHeader(admin.token),
				payload: {
					name: "Dev User",
					email,
					password: "password123",
					type: "DEV",
				},
			});

			expect(response.statusCode).toBe(201);

			const user = response.json().data.user;

			expect(user).toEqual(
				expect.objectContaining({
					email,
					name: "Dev User",
					type: "DEV",
					organizationId: admin.organizationId,
				}),
			);
			expect(user).not.toHaveProperty("password");
		});

		it("should return 401 without an Authorization header", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/users",
				payload: {
					name: "Dev User",
					email: uniqueEmail(),
					password: "password123",
					type: "DEV",
				},
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 409 when the email already exists", async () => {
			const email = uniqueEmail();

			const first = await app.inject({
				method: "POST",
				url: "/users",
				headers: authHeader(admin.token),
				payload: {
					name: "First User",
					email,
					password: "password123",
					type: "DEV",
				},
			});

			expect(first.statusCode).toBe(201);

			const response = await app.inject({
				method: "POST",
				url: "/users",
				headers: authHeader(admin.token),
				payload: {
					name: "Second User",
					email,
					password: "password123",
					type: "DEV",
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
				url: "/users",
				headers: authHeader(admin.token),
				payload: {
					name: "Dev User",
					email: uniqueEmail(),
					password: "short",
					type: "DEV",
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const dev = await seedDevUserAndLogin(app, admin.token);

			const response = await app.inject({
				method: "POST",
				url: "/users",
				headers: authHeader(dev.token),
				payload: {
					name: "Another User",
					email: uniqueEmail(),
					password: "password123",
					type: "DEV",
				},
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});
	});
});
