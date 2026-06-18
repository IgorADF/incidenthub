import { describe, it, expect, beforeEach } from "vitest";
import { AuthenticateUser } from "./authenticate-user";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { createTestAdminUser } from "@utils/tests/user";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { createTestOrganization } from "@utils/tests/organization";

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
    const { organization } = await createTestOrganization(uow);

    await createTestAdminUser(uow, organization, {
      email: credentials.email,
      password: credentials.password,
    });

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
    const { organization } = await createTestOrganization(uow);
    const { user } = await createTestAdminUser(uow, organization);

    const error = await sut
      .execute({
        email: user.getProps().email,
        password: "wrong-password",
      })
      .catch((err) => err);

    expect(error).toBeInstanceOf(InvalidCredentialError);
  });
});
