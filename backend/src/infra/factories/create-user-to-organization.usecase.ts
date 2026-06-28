import { CreateUserToOrganization } from "@domain/use-cases/create-user-to-organization";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function createUserToOrganizationFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const hashPasswordService = new HashPasswordService();
  const useCase = new CreateUserToOrganization(uow, hashPasswordService);

  return { useCase };
}
