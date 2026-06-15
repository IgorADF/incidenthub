import { Organization } from "../entities/organization";
import { User } from "../entities/user";
import { IMUOW } from "../repositories/in-memory/_uow";
import { hashPassword } from "./password";

export async function createOrganization(uow: IMUOW, name: string) {
  const organization = Organization.create({ name });
  await uow.repositories.organizations.create(organization);
  return organization;
}

export async function createUser(
  uow: IMUOW,
  organization: Organization,
  email: string,
  type: "ADMIN" | "DEV",
  password = "secret",
) {
  const user = User.create({
    organizationId: organization.getProps().id,
    email,
    password: await hashPassword(password),
    type,
  });
  await uow.repositories.users.create(user);
  return user;
}

export async function createAdminUser(
  uow: IMUOW,
  organization: Organization,
  email: string,
  password?: string,
) {
  return createUser(uow, organization, email, "ADMIN", password);
}

export async function createDevUser(
  uow: IMUOW,
  organization: Organization,
  email: string,
  password?: string,
) {
  return createUser(uow, organization, email, "DEV", password);
}
