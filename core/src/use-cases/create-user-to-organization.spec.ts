import { describe, it, expect, beforeEach } from "vitest";
import { Createusertoorganization } from "./create-user-to-organization";
import { IMUOW } from "../repositories/in-memory/_uow";
import { Organization } from "../entities/organization";
import { User } from "../entities/user";
import { hashPassword, comparePassword } from "../utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: Createusertoorganization;

const newUserInput = {
  email: "newuser@acme.com",
  password: "secret",
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

describe("Create User To Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createusertoorganization(uow);
  });

  it("should create a new user in the same organization when creator is admin", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");

    const result = await sut.execute(
      admin.getProps().id,
      newUserInput,
    );

    expect(result.user.getProps()).toEqual(
      expect.objectContaining({
        email: newUserInput.email,
        organizationId: organization.getProps().id,
        type: "DEV",
      }),
    );
    expect(result.user.getProps().id).toBeDefined();
    await expect(
      comparePassword(newUserInput.password, result.user.getProps().password),
    ).resolves.toBe(true);
  });

  it("should create a new user with the provided type", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");

    const result = await sut.execute(admin.getProps().id, {
      ...newUserInput,
      type: "ADMIN",
    });

    expect(result.user.getProps().type).toBe("ADMIN");
  });

  it("should throw NotAllowedError when creator is not found", async () => {
    await expect(
      sut.execute("non-existent-user-id", newUserInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw NotAllowedError when creator is not an admin", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const dev = await createDevUser(organization, "dev@acme.com");

    await expect(
      sut.execute(dev.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when email is already taken", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    await uow.repositories.organizations.create(organization);
    const admin = await createAdminUser(organization, "admin@acme.com");
    await createDevUser(organization, newUserInput.email);

    await expect(
      sut.execute(admin.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });
});
