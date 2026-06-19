import { describe, it, expect, beforeEach } from "vitest";
import { CreateOrganization } from "./create-organization";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { HashPasswordTestService } from "@domain/services/hash-password";

let uow: IMUOW;
let hashPasswordTestService: HashPasswordTestService;
let sut: CreateOrganization;

const orgInput = {
  name: "Acme Corp",
};

const userInput = {
  name: "User",
  email: "admin@acme.com",
  password: "secret",
};

describe("Create Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    hashPasswordTestService = new HashPasswordTestService();
    sut = new CreateOrganization(uow, hashPasswordTestService);
  });

  it("should create a new organization and the first user", async () => {
    const result = await sut.execute(orgInput, userInput);

    expect(result.organization.getProps()).toEqual(
      expect.objectContaining({ name: "Acme Corp" }),
    );
    expect(result.organization.getProps().id).toBeDefined();
    expect(result.user.getProps()).toEqual(
      expect.objectContaining({
        email: "admin@acme.com",
        organizationId: result.organization.getProps().id,
        type: "ADMIN",
      }),
    );
    expect(result.user.getProps().id).toBeDefined();
    await expect(
      hashPasswordTestService.compare(
        userInput.password,
        result.user.getProps().password,
      ),
    ).resolves.toBe(true);
  });

  it("should create the first user with the provided type", async () => {
    const result = await sut.execute(orgInput, {
      ...userInput,
      type: "DEV",
    });

    expect(result.user.getProps().type).toBe("DEV");
  });

  it("should throw EntityAlreadyExists when org name is taken", async () => {
    await sut.execute(orgInput, userInput);

    await expect(
      sut.execute(orgInput, {
        email: "other@acme.com",
        name: "New User",
        password: "secret",
      }),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should throw EntityAlreadyExists when user email is taken", async () => {
    await sut.execute(orgInput, userInput);

    await expect(
      sut.execute({ name: "Other Corp" }, userInput),
    ).rejects.toBeInstanceOf(EntityAlreadyExists);
  });

  it("should allow different users with same org name ", async () => {
    await sut.execute(orgInput, userInput);

    const result = await sut.execute(
      { name: "Other Corp" },
      {
        email: "admin@other.com",
        name: "New User",
        password: "secret",
      },
    );

    expect(result.organization.getProps().name).toBe("Other Corp");
    expect(result.user.getProps().email).toBe("admin@other.com");
  });
});
