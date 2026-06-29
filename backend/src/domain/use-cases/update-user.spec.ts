import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { UpdateUser } from "./update-user";

let uow: IMUOW;
let sut: UpdateUser;

describe("UpdateUser", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new UpdateUser(uow);
	});

	async function setupOrgWithAdmin() {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		return { organization, admin };
	}

	it("should update the name and recompute normalizedName", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "rename-dev@email.com",
			name: "Original Name",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id, {
			name: "New Name",
		});

		expect(result.user.name).toBe("New Name");
		expect(result.user.normalizedName).toBe("new name");

		const found = await uow.repositories.users.getById(dev.getProps().id);
		expect(found?.getProps().name).toBe("New Name");
		expect(found?.getProps().normalizedName).toBe("new name");
	});

	it("should update the email when it is unique", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "old-email@email.com",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id, {
			email: "brand-new-email@email.com",
		});

		expect(result.user.email).toBe("brand-new-email@email.com");
	});

	it("should allow updating the email to the same value (no-op)", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "same@email.com",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id, {
			email: "same@email.com",
		});

		expect(result.user.email).toBe("same@email.com");
	});

	it("should throw EntityAlreadyExists when the email belongs to another user", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		await createTestDevUser(uow, organization, {
			email: "taken@email.com",
			name: "Taken User",
		});
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "free@email.com",
			name: "To Update",
		});

		await expect(
			sut.execute(admin.getProps().id, dev.getProps().id, {
				email: "taken@email.com",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should throw EntityAlreadyExists when the email belongs to another org's user", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		await createTestDevUser(uow, orgB, {
			email: "cross-org@email.com",
			name: "Cross Org",
		});
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "free@email.com",
			name: "To Update",
		});

		await expect(
			sut.execute(admin.getProps().id, dev.getProps().id, {
				email: "cross-org@email.com",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should promote a DEV to ADMIN", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "promote@email.com",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id, {
			type: "ADMIN",
		});

		expect(result.user.type).toBe("ADMIN");
	});

	it("should demote an ADMIN to DEV when another admin exists", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: secondAdmin } = await createTestAdminUser(uow, organization, {
			email: "second-admin@email.com",
			name: "Second Admin",
		});

		const result = await sut.execute(
			admin.getProps().id,
			secondAdmin.getProps().id,
			{ type: "DEV" },
		);

		expect(result.user.type).toBe("DEV");
	});

	it("should throw NotAllowedError when demoting the last admin of the organization", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: secondAdmin } = await createTestAdminUser(uow, organization, {
			email: "only-admin-to-demote@email.com",
			name: "Only Admin",
		});

		await uow.repositories.users.delete(admin.getProps().id);

		await expect(
			sut.execute(admin.getProps().id, secondAdmin.getProps().id, {
				type: "DEV",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when actor is not admin", async () => {
		const { organization } = await setupOrgWithAdmin();
		const { user: admin } = await createTestAdminUser(uow, organization);
		const { user: devA } = await createTestDevUser(uow, organization, {
			email: "dev-a@email.com",
			name: "Dev A",
		});
		const { user: devB } = await createTestDevUser(uow, organization, {
			email: "dev-b@email.com",
			name: "Dev B",
		});

		await expect(
			sut.execute(devA.getProps().id, devB.getProps().id, {
				name: "Renamed",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);

		await expect(
			sut.execute(devA.getProps().id, admin.getProps().id, {
				name: "Renamed",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotFoundError when target user does not exist", async () => {
		const { admin } = await setupOrgWithAdmin();

		await expect(
			sut.execute(admin.getProps().id, "01940f8e-1f30-7c30-9a6f-1234567890ab", {
				name: "Renamed",
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should throw NotAllowedError when actor does not exist", async () => {
		const { organization } = await createTestOrganization(uow);
		await createTestAdminUser(uow, organization);

		await expect(
			sut.execute(
				"01940f8e-1f30-7c30-9a6f-1234567890ab",
				"01940f8e-1f30-7c30-9a6f-0000000000ab",
				{ name: "Renamed" },
			),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when target belongs to another organization", async () => {
		const { admin } = await setupOrgWithAdmin();

		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		const { user: adminB } = await createTestAdminUser(uow, orgB, {
			email: "admin-b@email.com",
			name: "Admin B",
		});

		await expect(
			sut.execute(admin.getProps().id, adminB.getProps().id, {
				name: "Renamed",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should allow admin to update their own name and email", async () => {
		const { admin } = await setupOrgWithAdmin();

		const result = await sut.execute(admin.getProps().id, admin.getProps().id, {
			name: "Self Renamed",
			email: "self-new@email.com",
		});

		expect(result.user.name).toBe("Self Renamed");
		expect(result.user.email).toBe("self-new@email.com");
	});

	it("should update all three fields at once", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "old@email.com",
			name: "Old Name",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id, {
			name: "All New Name",
			email: "all-new@email.com",
			type: "ADMIN",
		});

		expect(result.user).toEqual(
			expect.objectContaining({
				name: "All New Name",
				normalizedName: "all new name",
				email: "all-new@email.com",
				type: "ADMIN",
			}),
		);
	});

	it("should preserve password/organizationId/id/createdAt after update", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "preserve@email.com",
			name: "To Preserve",
		});
		const before =
			await uow.repositories.users.getByEmailWithPassword("preserve@email.com");
		const originalPassword = before?.getProps().password;
		const originalId = dev.getProps().id;
		const originalOrgId = dev.getProps().organizationId;
		const originalCreatedAt = dev.getProps().createdAt;

		await sut.execute(admin.getProps().id, dev.getProps().id, {
			name: "After Update",
			email: "after-update@email.com",
		});

		const after = await uow.repositories.users.getByEmailWithPassword(
			"after-update@email.com",
		);
		expect(after?.getProps().password).toBe(originalPassword);
		expect(after?.getProps().id).toBe(originalId);
		expect(after?.getProps().organizationId).toBe(originalOrgId);
		expect(after?.getProps().createdAt).toEqual(originalCreatedAt);
	});

	it("should reject a name that violates the schema (too short)", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "schema@email.com",
		});

		await expect(
			sut.execute(admin.getProps().id, dev.getProps().id, { name: "ab" }),
		).rejects.toThrow();
	});
});
