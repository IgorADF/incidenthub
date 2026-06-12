import { describe, it, expect, beforeEach } from "vitest";
import { Createorganization } from "./create-organization";
import { IMUOW } from "../repositories/in-memory/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

let uow: IMUOW;
let sut: Createorganization;

describe("Create Organization", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Createorganization(uow);
  });

  it("should create a new organization", async () => {
    const org = await sut.execute("Acme Corp");

    expect(org).toEqual(expect.objectContaining({ name: "Acme Corp" }));
    expect(org.id).toBeDefined();
  });

  it("should throw EntityAlreadyExists when org name is taken", async () => {
    await sut.execute("Acme Corp");

    await expect(() => sut.execute("Acme Corp")).rejects.toThrow(
      EntityAlreadyExists,
    );
  });

  it("should allow different org names", async () => {
    await sut.execute("Acme Corp");

    const org2 = await sut.execute("Other Corp");

    expect(org2.name).toBe("Other Corp");
  });
});
