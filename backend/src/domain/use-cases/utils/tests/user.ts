import { Organization } from "@domain/entities/organization";
import { CreateUserWithPasswordType, UserWithPassword } from "@domain/entities/user";
import { IMUOW } from "@domain/repositories/in-memory/_uow";
import { HashPasswordTestService } from "@domain/services/hash-password";

const _hashPasswordService = new HashPasswordTestService();

export async function createTestUser(
  uow: IMUOW,
  data: CreateUserWithPasswordType,
  hashPasswordTestService?: HashPasswordTestService,
) {
  const user = UserWithPassword.create({
    ...data,
    password: await (
      hashPasswordTestService ?? _hashPasswordService
    ).hashPassword(data.password as string),
  });

  await uow.repositories.users.create(user);
  return { user, creationData: data };
}

export async function createTestAdminUser(
  uow: IMUOW,
  organization: Organization,
  data?: Partial<CreateUserWithPasswordType>,
  hashPasswordTestService?: HashPasswordTestService,
) {
  const organizationId = organization.getProps().id;

  const creationData: CreateUserWithPasswordType = {
    email: "admuser@email.com",
    name: "Adm User",
    password: "password",
    organizationId,

    ...data,

    type: "ADMIN",
  };

  const { user } = await createTestUser(uow, creationData, hashPasswordTestService);

  return {
    user,
    creationData,
  };
}

export async function createTestDevUser(
  uow: IMUOW,
  organization: Organization,
  data?: Partial<CreateUserWithPasswordType>,
  hashPasswordTestService?: HashPasswordTestService,
) {
  const organizationId = organization.getProps().id;

  const creationData: CreateUserWithPasswordType = {
    email: "devuser@email.com",
    name: "Dev User",
    password: "password",
    organizationId,

    ...data,

    type: "DEV",
  };

  const { user } = await createTestUser(uow, creationData, hashPasswordTestService);

  return {
    user,
    creationData,
  };
}
