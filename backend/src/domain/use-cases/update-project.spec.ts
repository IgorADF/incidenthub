import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import { createTestProject } from "@domain/use-cases/utils/tests/project";
import {
	createTestAdminUser,
	createTestDevUser,
} from "@domain/use-cases/utils/tests/user";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";
import { UpdateProject } from "./update-project";

let uow: IMUOW;
let sut: UpdateProject;

describe("UpdateProject", () => {
	beforeEach(() => {
		uow = new IMUOW();
		sut = new UpdateProject(uow);
	});

	async function setup() {
		const { organization } = await createTestOrganization(uow);
		const { user: admin } = await createTestAdminUser(uow, organization);
		const { project } = await createTestProject(uow, organization);
		return { organization, admin, project };
	}

	it("should update the name", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				name: "Brand New Name",
			},
		);

		expect(result.project.name).toBe("Brand New Name");
		expect(result.project.id).toBe(project.getProps().id);
	});

	it("should throw EntityAlreadyExists when the name already belongs to another project in the same org", async () => {
		const { organization, admin } = await setup();
		const { project: projectA } = await createTestProject(uow, organization, {
			name: "Project A",
			publicPageSlug: "slug-a",
		});
		const { project: projectB } = await createTestProject(uow, organization, {
			name: "Project B",
			publicPageSlug: "slug-b",
		});

		await expect(
			sut.execute(admin.getProps().id, projectB.getProps().id, {
				name: "Project A",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should allow reassigning the same name (no-op)", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				name: project.getProps().name,
			},
		);

		expect(result.project.name).toBe(project.getProps().name);
	});

	it("should update the publicPageSlug when it is globally unique", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				publicPageSlug: "brand-new-slug",
			},
		);

		expect(result.project.publicPageSlug).toBe("brand-new-slug");
	});

	it("should throw EntityAlreadyExists when the slug belongs to another project", async () => {
		const { organization, admin } = await setup();
		const { project: projectA } = await createTestProject(uow, organization, {
			name: "Project A",
			publicPageSlug: "taken-slug",
		});
		const { project: projectB } = await createTestProject(uow, organization, {
			name: "Project B",
			publicPageSlug: "free-slug",
		});

		await expect(
			sut.execute(admin.getProps().id, projectB.getProps().id, {
				publicPageSlug: "taken-slug",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should throw EntityAlreadyExists when the slug belongs to another org's project (global unique)", async () => {
		const { organization, admin } = await setup();
		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		const { project: projectB } = await createTestProject(uow, orgB, {
			name: "Cross Org Project",
			publicPageSlug: "cross-org-slug",
		});
		const { project } = await createTestProject(uow, organization, {
			name: "My Project",
			publicPageSlug: "my-slug",
		});

		await expect(
			sut.execute(admin.getProps().id, project.getProps().id, {
				publicPageSlug: "cross-org-slug",
			}),
		).rejects.toBeInstanceOf(EntityAlreadyExists);
	});

	it("should allow reassigning the same slug (no-op)", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				publicPageSlug: project.getProps().publicPageSlug,
			},
		);

		expect(result.project.publicPageSlug).toBe(
			project.getProps().publicPageSlug,
		);
	});

	it("should set publicPageSlug explicit null and keep showPublicPage false", async () => {
		const { organization, admin } = await setup();
		const { project } = await createTestProject(uow, organization, {
			name: "Slug Project",
			showPublicPage: false,
			publicPageSlug: null,
		});

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				publicPageSlug: null,
			},
		);

		expect(result.project.publicPageSlug).toBeNull();
		expect(result.project.showPublicPage).toBe(false);
	});

	it("should clear publicPageSlug when showPublicPage is set to false (entity overwrite)", async () => {
		const { admin, project } = await setup();

		expect(project.getProps().showPublicPage).toBe(true);
		expect(project.getProps().publicPageSlug).not.toBeNull();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				showPublicPage: false,
			},
		);

		expect(result.project.showPublicPage).toBe(false);
		expect(result.project.publicPageSlug).toBeNull();
	});

	it("should preserve the existing slug when showPublicPage stays true", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				showPublicPage: true,
			},
		);

		expect(result.project.showPublicPage).toBe(true);
		expect(result.project.publicPageSlug).toBe(
			project.getProps().publicPageSlug,
		);
	});

	it("should reject setting showPublicPage true while clearing slug (entity refine)", async () => {
		const { admin, project } = await setup();

		await expect(
			sut.execute(admin.getProps().id, project.getProps().id, {
				showPublicPage: true,
				publicPageSlug: null,
			}),
		).rejects.toThrow();
	});

	it("should reject setting showPublicPage true without any slug when slug was null", async () => {
		const { organization, admin } = await setup();
		const { project } = await createTestProject(uow, organization, {
			name: "No Slug Project",
			showPublicPage: false,
			publicPageSlug: null,
		});

		await expect(
			sut.execute(admin.getProps().id, project.getProps().id, {
				showPublicPage: true,
			}),
		).rejects.toThrow();
	});

	it("should update showPublicPage to true when a slug is set on the same request", async () => {
		const { organization, admin } = await setup();
		const { project } = await createTestProject(uow, organization, {
			name: "Toggle Public",
			showPublicPage: false,
			publicPageSlug: null,
		});

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				showPublicPage: true,
				publicPageSlug: "new-public-slug",
			},
		);

		expect(result.project.showPublicPage).toBe(true);
		expect(result.project.publicPageSlug).toBe("new-public-slug");
	});

	it("should update all three fields at once", async () => {
		const { admin, project } = await setup();

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				name: "Full Update",
				showPublicPage: true,
				publicPageSlug: "full-update-slug",
			},
		);

		expect(result.project).toEqual(
			expect.objectContaining({
				name: "Full Update",
				showPublicPage: true,
				publicPageSlug: "full-update-slug",
			}),
		);
	});

	it("should preserve organizationId / id / createdAt after update", async () => {
		const { admin, project } = await setup();
		const originalId = project.getProps().id;
		const originalOrgId = project.getProps().organizationId;
		const originalCreatedAt = project.getProps().createdAt;

		const result = await sut.execute(
			admin.getProps().id,
			project.getProps().id,
			{
				name: "Renamed",
			},
		);

		expect(result.project.id).toBe(originalId);
		expect(result.project.organizationId).toBe(originalOrgId);
		expect(result.project.createdAt).toEqual(originalCreatedAt);
	});

	it("should throw NotAllowedError when actor is not admin", async () => {
		const { organization, project } = await setup();
		const { user: dev } = await createTestDevUser(uow, organization);

		await expect(
			sut.execute(dev.getProps().id, project.getProps().id, {
				name: "Dev Attempt",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotFoundError when project does not exist", async () => {
		const { admin } = await setup();

		await expect(
			sut.execute(admin.getProps().id, "01940f8e-1f30-7c30-9a6f-1234567890ab", {
				name: "New",
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should throw NotAllowedError when actor does not exist", async () => {
		const { project } = await setup();

		await expect(
			sut.execute(
				"01940f8e-1f30-7c30-9a6f-1234567890ab",
				project.getProps().id,
				{ name: "New" },
			),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should throw NotAllowedError when project belongs to another organization", async () => {
		const { admin } = await setup();

		const { organization: orgB } = await createTestOrganization(uow, {
			name: "Other Corp",
		});
		const { user: adminB } = await createTestAdminUser(uow, orgB);
		const { project: projectB } = await createTestProject(uow, orgB);

		await expect(
			sut.execute(admin.getProps().id, projectB.getProps().id, {
				name: "Cross Org Rename",
			}),
		).rejects.toBeInstanceOf(NotAllowedError);
	});

	it("should reject a name that violates the schema (empty)", async () => {
		const { admin, project } = await setup();

		await expect(
			sut.execute(admin.getProps().id, project.getProps().id, { name: "" }),
		).rejects.toThrow();
	});

	it("should reject a publicPageSlug that violates the slug format (uppercase)", async () => {
		const { admin, project } = await setup();

		await expect(
			sut.execute(admin.getProps().id, project.getProps().id, {
				publicPageSlug: "InvalidSlug",
			}),
		).rejects.toThrow();
	});
});
