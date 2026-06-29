import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { JwtTestService } from "@domain/services/jwt";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestAdminUser } from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { NotFoundError } from "./errors/NotFoundError";
import { ResetPassword } from "./reset-password";

let uow: IMUOW;
let jwtTestService: JwtTestService;
let hashPasswordTestService: HashPasswordTestService;
let sut: ResetPassword;

describe("Reset Password", () => {
	beforeEach(() => {
		uow = new IMUOW();
		jwtTestService = new JwtTestService();
		hashPasswordTestService = new HashPasswordTestService();
		sut = new ResetPassword(uow, jwtTestService, hashPasswordTestService);
	});

	it("should reset the user password when token is valid", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user } = await createTestAdminUser(
			uow,
			organization,
			{ email: "user@acme.com", password: "old-password" },
			hashPasswordTestService,
		);

		const token = await jwtTestService.signForgotPassword({
			userId: user.getProps().id,
		});

		const result = await sut.execute({
			token,
			password: "new-password",
		});

		expect(result).toEqual({ reset: true });

		const updated = await uow.repositories.users.getByEmailWithPassword(
			"user@acme.com",
		);
		const newPasswordHash = updated!.getProps().password as string;
		expect(newPasswordHash).not.toBe("new-password");
		expect(hashPasswordTestService.passwordCache[newPasswordHash]).toBe(
			"new-password",
		);
	});

	it("should throw InvalidCredentialError when token is invalid", async () => {
		await expect(
			sut.execute({ token: "invalid-token", password: "new-password" }),
		).rejects.toBeInstanceOf(InvalidCredentialError);
	});

	it("should throw NotFoundError when token is valid but user does not exist", async () => {
		const token = await jwtTestService.signForgotPassword({
			userId: "01940f8e-1f30-7c30-9a6f-1234567890ab",
		});

		await expect(
			sut.execute({ token, password: "new-password" }),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});