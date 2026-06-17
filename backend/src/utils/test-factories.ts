import { Organization } from "@domain/entities/organization";
import { Project } from "@domain/entities/project";
import { User } from "@domain/entities/user";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { hashPassword } from "./password";

export async function createOrganization(uow: IMUOW, name: string) {
  const organization = Organization.create({ name });
  await uow.repositories.organizations.create(organization);
  return organization;
}

export async function createProject(
  uow: IMUOW,
  organization: Organization,
  name: string,
) {
  const project = Project.create({
    organizationId: organization.getProps().id,
    name,
    showPublicPage: false,
    publicPageSlug: null,
  });
  await uow.repositories.projects.create(project);
  return project;
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
