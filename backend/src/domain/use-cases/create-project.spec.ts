import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { CreateProject } from "./create-project";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: CreateProject;

const privateProjectInput = {
	name: "Incident Hub",
	showPublicPage: false,
	publicPageSlug: null,
};

const publicProjectInput = {
	name: "Incident Hub",
	showPublicPage: true,
	publicPageSlug: "incident-hub",
};

describe("Create Project", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new CreateProject(uow);
	});

	it("should create a private project by default (showPublicPage=false, publicPageSlug=null)", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		const result = await sut.execute(admin.getProps().id, privateProjectInput);

		expect(result.project).toEqual(
			expect.objectContaining({
				name: "Incident Hub",
				organizationId: organization.getProps().id,
				showPublicPage: false,
				publicPageSlug: null,
			}),
		);
		expect(result.project.id).toBeDefined();
	});

	it("should create a public project with a public page slug", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		const result = await sut.execute(admin.getProps().id, publicProjectInput);

		expect(result.project).toEqual(
			expect.objectContaining({
				showPublicPage: true,
				publicPageSlug: "incident-hub",
			}),
		);
	});

	it("should null out publicPageSlug when showPublicPage is false even if a slug is provided", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		const result = await sut.execute(admin.getProps().id, {
			name: "Incident Hub",
			showPublicPage: false,
			publicPageSlug: "should-be-ignored",
		});

		expect(result.project).toEqual(
			expect.objectContaining({
				showPublicPage: false,
				publicPageSlug: null,
			}),
		);
	});

	it("should throw NotAllowedError when creator is not found", async () => {
		await expect(
			sut.execute("non-existent-user-id", privateProjectInput),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when creator is not an admin", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: dev } = await createTestDevUser(uow, organization);

		await expect(
			sut.execute(dev.getProps().id, privateProjectInput),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw EntityAlreadyExists when project name is already used in the organization", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		await sut.execute(admin.getProps().id, privateProjectInput);

		await expect(
			sut.execute(admin.getProps().id, privateProjectInput),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should allow same project name in different organizations", async () => {
		const { organization: organizationA } = await createTestOrganization(uow);

		const { organization: organizationB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});

		const { user: adminA } = await createTestAdminUser(uow, organizationA, {
			email: "admin@acme.com",
		});

		const { user: adminB } = await createTestAdminUser(uow, organizationB, {
			email: "admin@other.com",
		});

		await sut.execute(adminA.getProps().id, privateProjectInput);
		const result = await sut.execute(adminB.getProps().id, privateProjectInput);

		expect(result.project.name).toBe("Incident Hub");
	});

	it("should allow two private projects (null slug) in different organizations", async () => {
		const { organization: organizationA } = await createTestOrganization(uow);
		const { organization: organizationB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});

		const { user: adminA } = await createTestAdminUser(uow, organizationA, {
			email: "admin@acme.com",
		});
		const { user: adminB } = await createTestAdminUser(uow, organizationB, {
			email: "admin@other.com",
		});

		await sut.execute(adminA.getProps().id, privateProjectInput);
		const result = await sut.execute(adminB.getProps().id, privateProjectInput);

		expect(result.project.publicPageSlug).toBeNull();
	});

	it("should throw EntityAlreadyExists when public page slug is already used", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		await sut.execute(admin.getProps().id, publicProjectInput);

		await expect(
			sut.execute(admin.getProps().id, {
				name: "Other Project",
				showPublicPage: true,
				publicPageSlug: "incident-hub",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should throw EntityAlreadyExists when public page slug is already used in another organization", async () => {
		const { organization: organizationA } = await createTestOrganization(uow);

		const { organization: organizationB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});

		const { user: adminA } = await createTestAdminUser(uow, organizationA, {
			email: "admin@acme.com",
		});

		const { user: adminB } = await createTestAdminUser(uow, organizationB, {
			email: "admin@other.com",
		});

		await sut.execute(adminA.getProps().id, publicProjectInput);

		await expect(
			sut.execute(adminB.getProps().id, {
				name: "Other Project",
				showPublicPage: true,
				publicPageSlug: "incident-hub",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should allow different public page slugs across organizations", async () => {
		const { organization: organizationA } = await createTestOrganization(uow);
		const { organization: organizationB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});

		const { user: adminA } = await createTestAdminUser(uow, organizationA, {
			email: "admin@acme.com",
		});
		const { user: adminB } = await createTestAdminUser(uow, organizationB, {
			email: "admin@other.com",
		});

		await sut.execute(adminA.getProps().id, {
			name: "Project A",
			showPublicPage: true,
			publicPageSlug: "slug-a",
		});
		const result = await sut.execute(adminB.getProps().id, {
			name: "Project B",
			showPublicPage: true,
			publicPageSlug: "slug-b",
		});

		expect(result.project.publicPageSlug).toBe("slug-b");
	});

	it("should throw EntityAlreadyExists before LimitExceededError when duplicate name exists at the limit", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		for (let i = 1; i <= 5; i++) {
			await sut.execute(admin.getProps().id, {
				name: `Project ${i}`,
				showPublicPage: true,
				publicPageSlug: `slug-${i}`,
			});
		}

		await expect(
			sut.execute(admin.getProps().id, {
				name: "Project 1",
				showPublicPage: true,
				publicPageSlug: "another-slug",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should throw LimitExceededError when organization already has 5 projects", async () => {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);

		for (let i = 1; i <= 5; i++) {
			await sut.execute(admin.getProps().id, {
				name: `Project ${i}`,
				showPublicPage: true,
				publicPageSlug: `slug-${i}`,
			});
		}

		await expect(
			sut.execute(admin.getProps().id, {
				name: "Project 6",
				showPublicPage: true,
				publicPageSlug: "slug-6",
			}),
		).rejects.toBeInstanceOf(LimitExceededError);
	});
});
