import { describe, it, expect, beforeEach } from "vitest";
import { AuthenticateUser } from "./authenticate-user";
import { IMUOW } from "../repositories/in-memory/_uow";
import { createAdminUser, createOrganization } from "../utils/test-factories";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

let uow: IMUOW;
let sut: AuthenticateUser;

const credentials = {
  email: "admin@acme.com",
  password: "secret",
};

describe("Authenticate User", () => {
  beforeEach(() => {
    uow = new IMUOW();
    sut = new AuthenticateUser(uow);
  });

  it("should authenticate user with valid credentials", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    await createAdminUser(
      uow,
      organization,
      credentials.email,
      credentials.password,
    );

    const result = await sut.execute(credentials);

    expect(result.user.getProps()).toEqual(
      expect.objectContaining({
        email: credentials.email,
        type: "ADMIN",
      }),
    );
  });

  it("should throw InvalidCredentialError when user is not found", async () => {
    const error = await sut.execute(credentials).catch((err) => err);
    expect(error).toBeInstanceOf(InvalidCredentialError);
  });

  it("should throw InvalidCredentialError when password is incorrect", async () => {
    const organization = await createOrganization(uow, "Acme Corp");
    await createAdminUser(
      uow,
      organization,
      credentials.email,
      credentials.password,
    );

    const error = await sut
      .execute({ email: credentials.email, password: "wrong-password" })
      .catch((err) => err);

    expect(error).toBeInstanceOf(InvalidCredentialError);
  });
});
