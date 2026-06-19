import { CreateUserToOrganization } from "@domain/use-cases/create-user-to-organization";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function createUserToOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const hashPasswordService = new HashPasswordService();
  const useCase = new CreateUserToOrganization(uow, hashPasswordService);

  return { useCase };
}
