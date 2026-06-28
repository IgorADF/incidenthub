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

	describe("GET /users", () => {
		async function createUser(token: string, name: string) {
			const response = await app.inject({
				method: "POST",
				url: "/users",
				headers: authHeader(token),
				payload: {
					name,
					email: uniqueEmail(),
					password: "password123",
					type: "DEV",
				},
			});

			if (response.statusCode !== 201) {
				throw new Error(
					`createUser helper failed: ${response.statusCode} ${response.body}`,
				);
			}

			return response.json().data.user as { id: string; name: string };
		}

		it("should list users scoped to the admin organization without passwords", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const user = await createUser(localAdmin.token, "Ana User");
			const other = await seedOrganizationAndAdmin(app);
			const otherUser = await createUser(other.token, "Other User");

			const response = await app.inject({
				method: "GET",
				url: "/users",
				headers: authHeader(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			const users = response.json().data.users as Array<{
				id: string;
				organizationId: string;
			}>;
			expect(users.some((u) => u.id === user.id)).toBe(true);
			expect(users.some((u) => u.id === otherUser.id)).toBe(false);
			for (const listedUser of users) {
				expect(listedUser.organizationId).toBe(localAdmin.organizationId);
				expect(listedUser).not.toHaveProperty("password");
			}
		});

		it("should paginate users using cursor query params", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			await createUser(localAdmin.token, "Ana User");
			await createUser(localAdmin.token, "Bob User");

			const firstPage = await app.inject({
				method: "GET",
				url: "/users?limit=2",
				headers: authHeader(localAdmin.token),
			});

			expect(firstPage.statusCode).toBe(200);
			expect(firstPage.json().data.users).toHaveLength(2);
			expect(firstPage.json().data.pagination).toEqual({
				limit: 2,
				hasNextPage: true,
				nextCursor: {
					normalizedName: expect.any(String),
					id: expect.any(String),
				},
			});
			const nextCursor = firstPage.json().data.pagination.nextCursor;
			const nextPageQuery = new URLSearchParams({
				limit: "2",
				normalizedName: nextCursor.normalizedName,
				id: nextCursor.id,
			});

			const secondPage = await app.inject({
				method: "GET",
				url: `/users?${nextPageQuery.toString()}`,
				headers: authHeader(localAdmin.token),
			});

			expect(secondPage.statusCode).toBe(200);
			expect(secondPage.json().data.users).toHaveLength(1);
			expect(secondPage.json().data.pagination).toEqual({
				limit: 2,
				hasNextPage: false,
				nextCursor: { normalizedName: null, id: null },
			});
		});

		it("should return 401 without an Authorization header", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/users",
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await seedDevUserAndLogin(app, localAdmin.token);

			const response = await app.inject({
				method: "GET",
				url: "/users",
				headers: authHeader(dev.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});
	});
});
