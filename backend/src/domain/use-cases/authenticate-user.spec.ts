import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestAdminUser } from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthenticateUser } from "./authenticate-user";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

let uow: IMUOW;
let hashPasswordTestService: HashPasswordTestService;
let sut: AuthenticateUser;

const credentials = {
	email: "admin@acme.com",
	password: "secret",
};

describe("Authenticate User", () => {
	beforeEach(() => {
		uow = new IMUOW();
		hashPasswordTestService = new HashPasswordTestService();
		sut = new AuthenticateUser(uow, hashPasswordTestService);
	});

	it("should authenticate user with valid credentials", async () => {
		const { organization } = await createTestOrganization(uow);

		await createTestAdminUser(
			uow,
			organization,
			{
				email: credentials.email,
				password: credentials.password,
			},
			hashPasswordTestService,
		);

		const result = await sut.execute({
			email: credentials.email,
			password: credentials.password,
		});

		expect(result.user).toEqual(
			expect.objectContaining({
				email: credentials.email,
				type: "ADMIN",
			}),
		);
		expect(result.user).not.toHaveProperty("password");
	});

	it("should throw InvalidCredentialError when user is not found", async () => {
		const error = await sut.execute(credentials).catch((err) => err);
		expect(error).toBeInstanceOf(InvalidCredentialError);
	});

	it("should throw InvalidCredentialError when password is incorrect", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user } = await createTestAdminUser(
			uow,
			organization,
			{},
			hashPasswordTestService,
		);

		const error = await sut
			.execute({
				email: user.getProps().email,
				password: "wrong-password",
			})
			.catch((err) => err);

		expect(error).toBeInstanceOf(InvalidCredentialError);
	});
});
