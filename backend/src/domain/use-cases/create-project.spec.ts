import { describe, it, expect, beforeEach } from "vitest";
import { CreateProject } from "./create-project";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";
import { createTestOrganization } from "@utils/tests/organization";
import { createTestAdminUser, createTestDevUser } from "@utils/tests/user";

let uow: IMUOW;
let sut: CreateProject;

const projectInput = {
  name: "Incident Hub",
};

describe("Create Project", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new CreateProject(uow);
  });

  it("should create a project when creator is admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    const result = await sut.execute(admin.getProps().id, projectInput);

    expect(result.project.getProps()).toEqual(
      expect.objectContaining({
        name: "Incident Hub",
        organizationId: organization.getProps().id,
        showPublicPage: false,
        publicPageSlug: null,
      }),
    );
    expect(result.project.getProps().id).toBeDefined();
  });

  it("should create a project with public page slug", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    const result = await sut.execute(admin.getProps().id, {
      ...projectInput,
      showPublicPage: true,
      publicPageSlug: "incident-hub",
    });

    expect(result.project.getProps()).toEqual(
      expect.objectContaining({
        showPublicPage: true,
        publicPageSlug: "incident-hub",
      }),
    );
  });

  it("should throw NotAllowedError when creator is not found", async () => {
    await expect(
      sut.execute("non-existent-user-id", projectInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when creator is not an admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, projectInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when project name is already used in the organization", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);
    await sut.execute(admin.getProps().id, projectInput);

    await expect(
      sut.execute(admin.getProps().id, projectInput),
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

    await sut.execute(adminA.getProps().id, projectInput);
    const result = await sut.execute(adminB.getProps().id, projectInput);

    expect(result.project.getProps().name).toBe("Incident Hub");
  });

  it("should throw EntityAlreadyExists when public page slug is already used", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    await sut.execute(admin.getProps().id, {
      ...projectInput,
      publicPageSlug: "incident-hub",
    });

    await expect(
      sut.execute(admin.getProps().id, {
        name: "Other Project",
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

    await sut.execute(adminA.getProps().id, {
      ...projectInput,
      publicPageSlug: "incident-hub",
    });

    await expect(
      sut.execute(adminB.getProps().id, {
        name: "Other Project",
        publicPageSlug: "incident-hub",
      }),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should throw EntityAlreadyExists before LimitExceededError when duplicate name exists at the limit", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    for (let i = 1; i <= 5; i++) {
      await sut.execute(admin.getProps().id, {
        name: `Project ${i}`,
      });
    }

    await expect(
      sut.execute(admin.getProps().id, { name: "Project 1" }),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should throw LimitExceededError when organization already has 5 projects", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    for (let i = 1; i <= 5; i++) {
      await sut.execute(admin.getProps().id, {
        name: `Project ${i}`,
      });
    }

    await expect(
      sut.execute(admin.getProps().id, { name: "Project 6" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });
});
