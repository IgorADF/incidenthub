import { describe, it, expect, beforeEach } from "vitest";
import { CreateUserToOrganization } from "./create-user-to-organization";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { comparePassword } from "@utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";
import { createTestOrganization } from "@domain/use-cases/utils/tests/organization";
import {
  createTestAdminUser,
  createTestDevUser,
} from "@domain/use-cases/utils/tests/user";

let uow: IMUOW;
let sut: CreateUserToOrganization;

const newUserInput = {
  email: "newuser@acme.com",
  password: "secret",
  name: "My User",
};

describe("Create User To Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new CreateUserToOrganization(uow);
  });

  it("should create a new user in the same organization when creator is admin", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

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
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

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
    const { organization } = await createTestOrganization(uow);
    const { user: dev } = await createTestDevUser(uow, organization);

    await expect(
      sut.execute(dev.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it("should throw EntityAlreadyExists when email is already taken", async () => {
    const { organization } = await createTestOrganization(uow);
    const { user: admin } = await createTestAdminUser(uow, organization);

    await createTestDevUser(uow, organization, { email: newUserInput.email });

    await expect(
      sut.execute(admin.getProps().id, newUserInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });
});
