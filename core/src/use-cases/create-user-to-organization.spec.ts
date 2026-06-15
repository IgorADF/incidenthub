import { describe, it, expect, beforeEach } from "vitest";
import { Createusertoorganization } from "./create-user-to-organization";
import { IMUOW } from "../repositories/in-memory/_uow";
import { comparePassword } from "../utils/password";
import {
  createAdminUser,
  createDevUser,
  createOrganization,
} from "../utils/test-factories";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

let uow: IMUOW;
let sut: Createusertoorganization;

const newUserInput = {
  email: "newuser@acme.com",
  password: "secret",
};

describe("Create User To Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createusertoorganization(uow);
  });

  it("should create a new user in the same organization when creator is admin", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

    const result = await sut.execute(admin.getProps().id, newUserInput);

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
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");

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
    const organization = await createOrganization(uow, "Acme Corp");
    const dev = await createDevUser(uow, organization, "dev@acme.com");

    await expect(
      sut.execute(dev.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when email is already taken", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    const admin = await createAdminUser(uow, organization, "admin@acme.com");
    await createDevUser(uow, organization, newUserInput.email);

    await expect(
      sut.execute(admin.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });
});
