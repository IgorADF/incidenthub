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
	seedSecondAdmin,
	uniqueEmail,
	uniqueName,
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
				...authCookies(admin.token),
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

		it("should return 401 without a session cookie", async () => {
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
				...authCookies(admin.token),
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
				...authCookies(admin.token),
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
				...authCookies(admin.token),
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
				...authCookies(dev.token),
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
				...authCookies(token),
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
				...authCookies(localAdmin.token),
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
				...authCookies(localAdmin.token),
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
				...authCookies(localAdmin.token),
			});

			expect(secondPage.statusCode).toBe(200);
			expect(secondPage.json().data.users).toHaveLength(1);
			expect(secondPage.json().data.pagination).toEqual({
				limit: 2,
				hasNextPage: false,
				nextCursor: { normalizedName: null, id: null },
			});
		});

		it("should return 401 without a session cookie", async () => {
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
				...authCookies(dev.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});
	});

	describe("DELETE /users/:userId", () => {
		async function createDev(
			token: string,
			name = "Dev To Delete",
		): Promise<{ id: string }> {
			const response = await app.inject({
				method: "POST",
				url: "/users",
				...authCookies(token),
				payload: {
					name,
					email: uniqueEmail(),
					password: "password123",
					type: "DEV",
				},
			});

			if (response.statusCode !== 201) {
				throw new Error(
					`createDev helper failed: ${response.statusCode} ${response.body}`,
				);
			}

			return { id: response.json().data.user.id };
		}

		it("should delete a DEV user when actor is admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({ deleted: true });

			const list = await app.inject({
				method: "GET",
				url: "/users",
				...authCookies(localAdmin.token),
			});
			const ids = (list.json().data.users as Array<{ id: string }>).map(
				(u) => u.id,
			);
			expect(ids).not.toContain(dev.id);
		});

		it("should delete another ADMIN when the org has more than one admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const secondAdmin = await seedSecondAdmin(app, localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${secondAdmin.userId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data).toEqual({ deleted: true });
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${dev.id}`,
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);
			const devUser = await seedDevUserAndLogin(app, localAdmin.token);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${dev.id}`,
				...authCookies(devUser.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 403 when admin tries to delete themselves", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${localAdmin.userId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 403 when deleting the last admin of the organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${localAdmin.userId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the target user does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: "/users/01940f8e-1f30-7c30-9a6f-1234567890ab",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when target belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const otherOrg = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: `/users/${otherOrg.userId}`,
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 400 when the userId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "DELETE",
				url: "/users/not-a-uuid",
				...authCookies(localAdmin.token),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should still allow listing users from the other organization after a cross-org delete attempt", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const otherOrg = await seedOrganizationAndAdmin(app);

			await app.inject({
				method: "DELETE",
				url: `/users/${otherOrg.userId}`,
				...authCookies(localAdmin.token),
			});

			const list = await app.inject({
				method: "GET",
				url: "/users",
				...authCookies(otherOrg.token),
			});

			expect(list.statusCode).toBe(200);
			const ids = (list.json().data.users as Array<{ id: string }>).map(
				(u) => u.id,
			);
			expect(ids).toContain(otherOrg.userId);
		});
	});

	describe("PATCH /users/:userId", () => {
		async function createDev(
			token: string,
			name = "Dev To Edit",
		): Promise<{ id: string; email: string }> {
			const email = uniqueEmail();
			const response = await app.inject({
				method: "POST",
				url: "/users",
				...authCookies(token),
				payload: { name, email, password: "password123", type: "DEV" },
			});

			if (response.statusCode !== 201) {
				throw new Error(
					`createDev helper failed: ${response.statusCode} ${response.body}`,
				);
			}

			return { id: response.json().data.user.id, email };
		}

		it("should update the name and return the updated user", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { name: "Renamed Dev" },
			});

			expect(response.statusCode).toBe(200);
			const user = response.json().data.user;
			expect(user.id).toBe(dev.id);
			expect(user.name).toBe("Renamed Dev");
			expect(user.normalizedName).toBe("renamed dev");
			expect(user).not.toHaveProperty("password");
		});

		it("should update the email when it is unique", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const newEmail = uniqueEmail();
			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { email: newEmail },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.user.email).toBe(newEmail);
		});

		it("should return 409 when the email already belongs to another user", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const other = await createDev(localAdmin.token, "Other Dev");
			const dev = await createDev(localAdmin.token, "Dev To Edit");

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { email: other.email },
			});

			expect(response.statusCode).toBe(409);
			expect(response.json()).toEqual(
				expect.objectContaining({
					code: "EntityAlreadyExists",
					context: { entity: "user", field: "email" },
				}),
			);
		});

		it("should promote a DEV to ADMIN", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { type: "ADMIN" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.user.type).toBe("ADMIN");
		});

		it("should demote an ADMIN to DEV when another admin exists", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const secondAdmin = await seedSecondAdmin(app, localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${secondAdmin.userId}`,
				...authCookies(localAdmin.token),
				payload: { type: "DEV" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.user.type).toBe("DEV");
		});

		it("should return 403 when demoting the last admin of the organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${localAdmin.userId}`,
				...authCookies(localAdmin.token),
				payload: { type: "DEV" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 401 without a session cookie", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("UNAUTHORIZED");
		});

		it("should return 403 when the caller is not an admin", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);
			const devUser = await seedDevUserAndLogin(app, localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(devUser.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 404 when the target user does not exist", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: "/users/01940f8e-1f30-7c30-9a6f-1234567890ab",
				...authCookies(localAdmin.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 403 when target belongs to another organization", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const otherOrg = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${otherOrg.userId}`,
				...authCookies(localAdmin.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(403);
			expect(response.json().code).toBe("NotAllowedError");
		});

		it("should return 400 when the userId param is not a uuid", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);

			const response = await app.inject({
				method: "PATCH",
				url: "/users/not-a-uuid",
				...authCookies(localAdmin.token),
				payload: { name: "Renamed" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 when the body is empty", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: {},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 when the name is too short", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { name: "ab" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should allow an admin to update their own profile", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const newName = uniqueName("Self");

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${localAdmin.userId}`,
				...authCookies(localAdmin.token),
				payload: { name: newName, email: uniqueEmail() },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().data.user.name).toBe(newName);
		});

		it("should update all three fields at once", async () => {
			const localAdmin = await seedOrganizationAndAdmin(app);
			const dev = await createDev(localAdmin.token);

			const newName = uniqueName("All");
			const newEmail = uniqueEmail();

			const response = await app.inject({
				method: "PATCH",
				url: `/users/${dev.id}`,
				...authCookies(localAdmin.token),
				payload: { name: newName, email: newEmail, type: "ADMIN" },
			});

			expect(response.statusCode).toBe(200);
			const user = response.json().data.user;
			expect(user).toEqual(
				expect.objectContaining({
					name: newName,
					normalizedName: newName.toLowerCase(),
					email: newEmail,
					type: "ADMIN",
				}),
			);
		});
	});
});
