import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";
import { beforeEach, describe, expect, it } from "vitest";
import { CreateOrganization } from "./create-organization";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

let uow: IMUOW;
let hashPasswordTestService: HashPasswordTestService;
let sut: CreateOrganization;

const orgInput = {
	organization: {
		name: "Acme Corp",
	},
	user: {
		name: "User",
		email: "admin@acme.com",
		password: "secret",
	},
};

describe("Create Organization", () => {
	beforeEach(() => {
		uow = new IMUOW();
		hashPasswordTestService = new HashPasswordTestService();
		sut = new CreateOrganization(uow, hashPasswordTestService);
	});

	it("should create a new organization and the first user", async () => {
		const result = await sut.execute(orgInput);

		expect(result.organization).toEqual(
			expect.objectContaining({ name: "Acme Corp" }),
		);
		expect(result.organization.id).toBeDefined();
		expect(result.user).toEqual(
			expect.objectContaining({
				email: "admin@acme.com",
				organizationId: result.organization.id,
				type: "ADMIN",
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
				orgInput.user.password,
				persistedUser!.getProps().password,
			),
		).resolves.toBe(true);
	});

	it("should throw EntityAlreadyExists when org name is taken", async () => {
		await sut.execute(orgInput);

		await expect(
			sut.execute({
				organization: { name: "Acme Corp" },
				user: {
					email: "other@acme.com",
					name: "New User",
					password: "secret",
				},
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should throw EntityAlreadyExists when user email is taken", async () => {
		await sut.execute(orgInput);

		await expect(
			sut.execute({
				organization: { name: "Other Corp" },
				user: orgInput.user,
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should allow different users with same org name ", async () => {
		await sut.execute(orgInput);

		const result = await sut.execute({
			organization: { name: "Other Corp" },
			user: {
				email: "admin@other.com",
				name: "New User",
				password: "secret",
			},
		});

		expect(result.organization.name).toBe("Other Corp");
		expect(result.user.email).toBe("admin@other.com");
	});
});
