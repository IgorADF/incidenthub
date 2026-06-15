import { describe, it, expect, beforeEach } from "vitest";
import { Authenticateuser } from "./authenticate-user";
import { IMUOW } from "../repositories/in-memory/_uow";
import { Organization } from "../entities/organization";
import { User } from "../entities/user";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

let uow: IMUOW;
let sut: Authenticateuser;

const credentials = {
  email: "admin@acme.com",
  password: "secret",
};

describe("Authenticate User", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new Authenticateuser(uow);
  });

  it("should authenticate user with valid credentials", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    const user = User.create({
      organizationId: organization.getProps().id,
      ...credentials,
      type: "ADMIN",
    });

    await uow.repositories.organizations.create(organization);
    await uow.repositories.users.create(user);

    const result = await sut.execute(credentials);

    expect(result.user.getProps()).toEqual(
      expect.objectContaining({
        email: credentials.email,
        type: "ADMIN",
      }),
    );
    expect(result.user.getProps().password).toBe(credentials.password);
  });

  it("should throw InvalidCredentialError when user is not found", async () => {
    const error = await sut.execute(credentials).catch((err) => err);
    expect(error).toBeInstanceOf(InvalidCredentialError);
  });

  it("should throw InvalidCredentialError when password is incorrect", async () => {
    const organization = Organization.create({ name: "Acme Corp" });
    const user = User.create({
      organizationId: organization.getProps().id,
      email: credentials.email,
      password: credentials.password,
      type: "ADMIN",
    });

    await uow.repositories.organizations.create(organization);
    await uow.repositories.users.create(user);

    const error = await sut
      .execute({ email: credentials.email, password: "wrong-password" })
      .catch((err) => err);

    expect(error).toBeInstanceOf(InvalidCredentialError);
  });
});
