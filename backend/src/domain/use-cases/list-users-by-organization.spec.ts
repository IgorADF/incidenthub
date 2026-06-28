import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
	createTestAdminUser,
	createTestDevUser,
	createTestUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { NotAllowedError } from "./errors/NotAllowedError";
import { ListUsersByOrganization } from "./list-users-by-organization";

let uow: IMUOW;
let sut: ListUsersByOrganization;

describe("List Users By Organization", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new ListUsersByOrganization(uow);
	});

	it("should list users from the admin organization ordered by name", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization, {
			email: "admin-list@email.com",
			name: "Zoe Admin",
		});
		await createTestUser(uow, {
			organizationId: organization.getProps().id,
			email: "cara@email.com",
			name: "Cara",
			password: "password",
			type: "DEV",
		});
		await createTestUser(uow, {
			organizationId: organization.getProps().id,
			email: "ana@email.com",
			name: "Ana",
			password: "password",
			type: "DEV",
		});
		await createTestUser(uow, {
			organizationId: organization.getProps().id,
			email: "bob@email.com",
			name: "Bob",
			password: "password",
			type: "DEV",
		});

		const result = await sut.execute(admin.getProps().id, {
			limit: 3,
			cursor: { normalizedName: null, id: null },
		});

		expect(result.users.map((user) => user.name)).toEqual([
			"Ana",
			"Bob",
			"Cara",
		]);
		expect(result.pagination).toEqual({
			limit: 3,
			hasNextPage: true,
			nextCursor: {
				normalizedName: "cara",
				id: expect.any(String),
			},
		});
		expect(result.users[0]).not.toHaveProperty("password");
	});

	it("should continue listing after the cursor", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization, {
			email: "admin-cursor@email.com",
			name: "Zoe Admin",
		});
		for (const name of ["Ana", "Bob", "Cara"]) {
			await createTestUser(uow, {
				organizationId: organization.getProps().id,
				email: `${name.toLowerCase()}-cursor@email.com`,
				name,
				password: "password",
				type: "DEV",
			});
		}

		const firstPage = await sut.execute(admin.getProps().id, {
			limit: 2,
			cursor: { normalizedName: null, id: null },
		});
		const secondPage = await sut.execute(admin.getProps().id, {
			limit: 2,
			cursor: firstPage.pagination.nextCursor,
		});

		expect(firstPage.users.map((user) => user.name)).toEqual(["Ana", "Bob"]);
		expect(secondPage.users.map((user) => user.name)).toEqual([
			"Cara",
			"Zoe Admin",
		]);
		expect(secondPage.pagination).toEqual({
			limit: 2,
			hasNextPage: false,
			nextCursor: { normalizedName: null, id: null },
		});
	});

	it("should not list users from another organization", async () => {
		const { organization } = await createTestOrganization(uow);
		const { organization: otherOrganization } = await createTestOrganization(
			uow,
			{
				name: "Other Org",
			},
		);
		const { user: admin } = await createTestAdminUser(uow, organization, {
			email: "admin-scoped@email.com",
			name: "Admin Scoped",
		});
		await createTestDevUser(uow, organization, {
			email: "same-org@email.com",
			name: "Same Org",
		});
		await createTestDevUser(uow, otherOrganization, {
			email: "other-org@email.com",
			name: "Other Org User",
		});

		const result = await sut.execute(admin.getProps().id, {
			limit: 20,
			cursor: { normalizedName: null, id: null },
		});

		expect(result.users.map((user) => user.email)).toContain(
			"same-org@email.com",
		);
		expect(result.users.map((user) => user.email)).not.toContain(
			"other-org@email.com",
		);
	});

	it("should throw NotAllowedError when the requester is not an admin", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: dev } = await createTestDevUser(uow, organization);

		await expect(
			sut.execute(dev.getProps().id, {
				limit: 20,
				cursor: { normalizedName: null, id: null },
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});
});
