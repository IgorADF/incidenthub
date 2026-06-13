import { describe, it, expect, beforeEach } from "vitest";
import { Createorganization } from "./create-organization";
import { IMUOW } from "../repositories/in-memory/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

let uow: IMUOW;
let sut: Createorganization;

const userInput = {
  email: "admin@acme.com",
  password: "secret",
};

describe("Create Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createorganization(uow);
  });

  it("should create a new organization and the first user", async () => {
    const result = await sut.execute("Acme Corp", userInput);

    expect(result.organization).toEqual(
      expect.objectContaining({ name: "Acme Corp" }),
    );
    expect(result.organization.id).toBeDefined();
    expect(result.user).toEqual(
      expect.objectContaining({
        email: "admin@acme.com",
        organizationId: result.organization.id,
        type: "ADMIN",
      }),
    );
    expect(result.user.id).toBeDefined();
  });

  it("should create the first user with the provided type", async () => {
    const result = await sut.execute("Acme Corp", {
      ...userInput,
      type: "DEV",
    });

    expect(result.user.type).toBe("DEV");
  });

  it("should throw EntityAlreadyExists when org name is taken", async () => {
    await sut.execute("Acme Corp", userInput);

    await expect(() =>
      sut.execute("Acme Corp", { email: "other@acme.com", password: "secret" }),
    ).rejects.toMatchObject({
      code: "EntityAlreadyExists",
      context: { entity: "organization", field: "name" },
    });
  });

  it("should throw EntityAlreadyExists when user email is taken", async () => {
    await sut.execute("Acme Corp", userInput);

    await expect(() => sut.execute("Other Corp", userInput)).rejects.toMatchObject({
      code: "EntityAlreadyExists",
      context: { entity: "user", field: "email" },
    });
  });

  it("should allow different users with same org name ", async () => {
    await sut.execute("Acme Corp", userInput);

    const result = await sut.execute("Other Corp", {
      email: "admin@other.com",
      password: "secret",
    });

    expect(result.organization.name).toBe("Other Corp");
    expect(result.user.email).toBe("admin@other.com");
  });
});
