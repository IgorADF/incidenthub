import { JwtService } from "@infra/services/jwt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import {
	runFinalTestConfigs,
	runInitTestConfigs,
} from "./helpers/run-test-config";
import { seedOrganizationAndAdmin } from "./helpers/seed";

let app: FastifyZodInstance;
let admin: {
	token: string;
	userId: string;
	email: string;
	password: string;
};
let resetUser: {
	userId: string;
	email: string;
	password: string;
};

const jwtService = new JwtService();

describe("auth routes (e2e)", () => {
	beforeAll(async () => {
		app = await runInitTestConfigs();
		admin = await seedOrganizationAndAdmin(app);
	});

	afterAll(async () => {
		await runFinalTestConfigs();
	});

	describe("POST /auth/login", () => {
		it("should set a session cookie and return the user with valid credentials", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: admin.email, password: admin.password },
			});

			expect(response.statusCode).toBe(200);

			const setCookie = response.headers["set-cookie"];
			expect(setCookie).toBeDefined();
			const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
			expect(cookieStr).toMatch(
				new RegExp(`${"ih_session"}=`, "i"),
			);
			expect(cookieStr?.toLowerCase()).toContain("httponly");

			const body = response.json().data;
			expect(body).not.toHaveProperty("token");
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

	describe("POST /password/reset", () => {
		beforeAll(async () => {
			resetUser = await seedOrganizationAndAdmin(app);
		});

		it("should reset the password and allow login with the new password", async () => {
			const resetToken = await jwtService.signForgotPassword({
				userId: resetUser.userId,
			});
			const newPassword = "brand-new-password";

			const response = await app.inject({
				method: "POST",
				url: "/password/reset",
				payload: { token: resetToken, password: newPassword },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({ reset: true });

			const loginNew = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: resetUser.email, password: newPassword },
			});
			expect(loginNew.statusCode).toBe(200);

			const loginOld = await app.inject({
				method: "POST",
				url: "/auth/login",
				payload: { email: resetUser.email, password: resetUser.password },
			});
			expect(loginOld.statusCode).toBe(401);
			expect(loginOld.json().code).toBe("InvalidCredentialError");
		});

		it("should return 401 for an invalid token", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/password/reset",
				payload: { token: "not-a-real-token", password: "new-password" },
			});

			expect(response.statusCode).toBe(401);
			expect(response.json().code).toBe("InvalidCredentialError");
		});

		it("should return 404 when the token is valid but the user no longer exists", async () => {
			const resetToken = await jwtService.signForgotPassword({
				userId: "01940f8e-1f30-7c30-9a6f-1234567890ab",
			});

			const response = await app.inject({
				method: "POST",
				url: "/password/reset",
				payload: { token: resetToken, password: "new-password" },
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().code).toBe("NotFoundError");
		});

		it("should return 400 when the password is too short", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/password/reset",
				payload: { token: "any-token", password: "short" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});

		it("should return 400 when the token is missing", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/password/reset",
				payload: { password: "new-password" },
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().code).toBe("VALIDATION_ERROR");
		});
	});
});
