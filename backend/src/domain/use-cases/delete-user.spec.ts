import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { DeleteUser } from "./delete-user";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

let uow: IMUOW;
let sut: DeleteUser;

describe("DeleteUser", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new DeleteUser(uow);
	});

	async function setupOrgWithAdmin() {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		return { organization, admin };
	}

	it("should delete a DEV user when actor is admin", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "dev1@email.com",
		});

		const result = await sut.execute(admin.getProps().id, dev.getProps().id);

		expect(result.deleted).toBe(true);

		const found = await uow.repositories.users.getById(dev.getProps().id);
		expect(found).toBeNull();
	});

	it("should delete another ADMIN when there is more than one admin in the org", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: secondAdmin } = await createTestAdminUser(uow, organization, {
			email: "second-admin@email.com",
		});

		const result = await sut.execute(
			admin.getProps().id,
			secondAdmin.getProps().id,
		);

		expect(result.deleted).toBe(true);

		const found = await uow.repositories.users.getById(
			secondAdmin.getProps().id,
		);
		expect(found).toBeNull();
	});

	it("should throw NotAllowedError when actor is not admin", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: devA } = await createTestDevUser(uow, organization, {
			email: "dev-a@email.com",
		});
		const { user: devB } = await createTestDevUser(uow, organization, {
			email: "dev-b@email.com",
		});

		await expect(
			sut.execute(devA.getProps().id, devB.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);

		await expect(
			sut.execute(devA.getProps().id, admin.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when actor tries to delete themselves", async () => {
		const { admin } = await setupOrgWithAdmin();

		await expect(
			sut.execute(admin.getProps().id, admin.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when deleting the last admin of the organization", async () => {
		const { organization, admin } = await setupOrgWithAdmin();
		const { user: dev } = await createTestDevUser(uow, organization, {
			email: "last-org-dev@email.com",
		});

		await expect(
			sut.execute(admin.getProps().id, admin.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);

		await expect(
			sut.execute(dev.getProps().id, admin.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotFoundError when target user does not exist", async () => {
		const { admin } = await setupOrgWithAdmin();

		await expect(
			sut.execute(admin.getProps().id, "01940f8e-1f30-7c30-9a6f-1234567890ab"),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should throw NotAllowedError when actor does not exist", async () => {
		const { organization } = await createTestOrganization(uow);
		await createTestAdminUser(uow, organization);

		await expect(
			sut.execute(
				"01940f8e-1f30-7c30-9a6f-1234567890ab",
				"01940f8e-1f30-7c30-9a6f-0000000000ab",
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
		});

		await expect(
			sut.execute(admin.getProps().id, adminB.getProps().id),
		).rejects.toBeInstanceOf(NotAllowedError);
	});
});
