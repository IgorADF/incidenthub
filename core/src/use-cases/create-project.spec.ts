import { describe, it, expect, beforeEach } from "vitest";
import { Createproject } from "./create-project";
import { IMUOW } from "../repositories/in-memory/_uow";
import { Organization } from "../entities/organization";
import { User } from "../entities/user";
import { hashPassword } from "../utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: Createproject;

const projectInput = {
  name: "Incident Hub",
};

async function createAdminUser(organization: Organization, email: string) {
  const user = User.create({
    organizationId: organization.getProps().id,
    email,
    password: await hashPassword("admin-secret"),
    type: "ADMIN",
  });
  await uow.repositories.users.create(user);
  return user;
}

async function createDevUser(organization: Organization, email: string) {
  const user = User.create({
    organizationId: organization.getProps().id,
    email,
    password: await hashPassword("dev-secret"),
    type: "DEV",
  });
  await uow.repositories.users.create(user);
  return user;
}

describe("Create Project", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createproject(uow);
  });

  it("should create a project when creator is admin", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");

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
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");

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
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const dev = await createDevUser(organization, "dev@acme.com");

    await expect(
      sut.execute(dev.getProps().id, projectInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when project name is already used in the organization", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");
    await sut.execute(admin.getProps().id, projectInput);

    await expect(
      sut.execute(admin.getProps().id, projectInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should allow same project name in different organizations", async () => {
    const organizationA = Organization.create({ name: "Acme Corp" });
    const organizationB = Organization.create({ name: "Other Corp" });
    await uow.repositories.organizations.create(organizationA);
    await uow.repositories.organizations.create(organizationB);
    const adminA = await createAdminUser(organizationA, "admin@acme.com");
    const adminB = await createAdminUser(organizationB, "admin@other.com");

    await sut.execute(adminA.getProps().id, projectInput);
    const result = await sut.execute(adminB.getProps().id, projectInput);

    expect(result.project.getProps().name).toBe("Incident Hub");
  });

  it("should throw EntityAlreadyExists when public page slug is already used", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");
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
});
