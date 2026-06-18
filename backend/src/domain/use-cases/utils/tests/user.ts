import { Organization } from "@domain/entities/organization";
import { CreateUserType, User } from "@domain/entities/user";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { hashPassword } from "../../../../utils/password";

export async function createTestUser(uow: IMUOW, data: CreateUserType) {
  const user = User.create({
    ...data,
    password: await hashPassword(data.password as string),
  });

  await uow.repositories.users.create(user);
  return user;
}

export async function createTestAdminUser(
  uow: IMUOW,
  organization: Organization,
  data?: Partial<CreateUserType>,
) {
  const organizationId = organization.getProps().id;

  const creationData: CreateUserType = {
    email: "admuser@email.com",
    name: "Adm User",
    password: "password",
    organizationId,

    ...data,

    type: "ADMIN",
  };

  const user = await createTestUser(uow, creationData);

  return {
    user,
    creationData,
  };
}

export async function createTestDevUser(
  uow: IMUOW,
  organization: Organization,
  data?: Partial<CreateUserType>,
) {
  const organizationId = organization.getProps().id;

  const creationData: CreateUserType = {
    email: "devuser@email.com",
    name: "Dev User",
    password: "password",
    organizationId,

    ...data,

    type: "DEV",
  };

  const user = await createTestUser(uow, creationData);

  return {
    user,
    creationData,
  };
}
