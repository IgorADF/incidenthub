import { describe, it, expect, beforeEach } from "vitest";
import { CreateProject } from "./create-project";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import {
  createAdminUser,
  createDevUser,
  createOrganization,
} from "@utils/test-factories";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { LimitExceededError } from "./errors/LimitExceededError";
import { NotAllowedError } from "./errors/NotAllowedError";

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
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    const result = await sut.execute(admin.getProps().id.value, projectInput);

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
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    const result = await sut.execute(admin.getProps().id.value, {
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
    const organization = await createOrganization(uow, "Acme Corp");
    const dev = await createDevUser(uow, organization, "dev@acme.com");

    await expect(
      sut.execute(dev.getProps().id.value, projectInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when project name is already used in the organization", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    await sut.execute(admin.getProps().id.value, projectInput);

    await expect(
      sut.execute(admin.getProps().id.value, projectInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should allow same project name in different organizations", async () => {
    const organizationA = await createOrganization(uow, "Acme Corp");
    const organizationB = await createOrganization(uow, "Other Corp");
    const adminA = await createAdminUser(uow, organizationA, "admin@acme.com");
    const adminB = await createAdminUser(uow, organizationB, "admin@other.com");

    await sut.execute(adminA.getProps().id.value, projectInput);
    const result = await sut.execute(adminB.getProps().id.value, projectInput);

    expect(result.project.getProps().name).toBe("Incident Hub");
  });

  it("should throw EntityAlreadyExists when public page slug is already used", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    await sut.execute(admin.getProps().id.value, {
      ...projectInput,
      publicPageSlug: "incident-hub",
    });

    await expect(
      sut.execute(admin.getProps().id.value, {
        name: "Other Project",
        publicPageSlug: "incident-hub",
      }),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should throw LimitExceededError when organization already has 5 projects", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    for (let i = 1; i <= 5; i++) {
      await sut.execute(admin.getProps().id.value, {
        name: `Project ${i}`,
      });
    }

    await expect(
      sut.execute(admin.getProps().id.value, { name: "Project 6" }),
    ).rejects.toBeInstanceOf(LimitExceededError);
  });
});
