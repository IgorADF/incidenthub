import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import {
	CreateUserToOrganization,
	type CreateUserToOrganizationInput,
} from "./create-user-to-organization";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let hashPasswordTestService: HashPasswordTestService;
let sut: CreateUserToOrganization;

const newUserInput: CreateUserToOrganizationInput = {
	email: "newuser@acme.com",
	password: "secret",
	name: "My User",
	type: "DEV",
};

describe("Create User To Organization", () => {
	beforeEach(() => {
		uow = new IMUOW();
		hashPasswordTestService = new HashPasswordTestService();
		sut = new CreateUserToOrganization(uow, hashPasswordTestService);
	});

	it("should create a new user in the same organization when creator is admin", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(
			uow,
			organization,
			{},
			hashPasswordTestService,
		);

		const result = await sut.execute(admin.getProps().id, {
			...newUserInput,
			type: "DEV",
		});

		expect(result.user).toEqual(
			expect.objectContaining({
				email: newUserInput.email,
				organizationId: organization.getProps().id,
				type: "DEV",
			}),
		);
		expect(result.user.id).toBeDefined();
		expect(result.user).not.toHaveProperty("password");

		const persistedUser = await uow.repositories.users.getByEmailWithPassword(
			result.user.email,
		);
		expect(persistedUser).not.toBeNull();
		await expect(
			hashPasswordTestService.compare(
				newUserInput.password,
				persistedUser!.getProps().password,
			),
		).resolves.toBe(true);
	});

	it("should create a new user with the provided type", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(
			uow,
			organization,
			{},
			hashPasswordTestService,
		);

		const result = await sut.execute(admin.getProps().id, {
			...newUserInput,
			type: "ADMIN",
		});

		expect(result.user.type).toBe("ADMIN");
	});

	it("should throw NotAllowedError when creator is not found", async () => {
		await expect(
			sut.execute("non-existent-user-id", newUserInput),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when creator is not an admin", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: dev } = await createTestDevUser(
			uow,
			organization,
			{},
			hashPasswordTestService,
		);

		await expect(
			sut.execute(dev.getProps().id, newUserInput),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw EntityAlreadyExists when email is already taken", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(
			uow,
			organization,
			{},
			hashPasswordTestService,
		);

		await createTestDevUser(
			uow,
			organization,
			{ email: newUserInput.email },
			hashPasswordTestService,
		);

		await expect(
			sut.execute(admin.getProps().id, newUserInput),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});
});
