import { CreateUserToOrganization } from "@domain/use-cases/create-user-to-organization";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createUserToOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateUserToOrganization(uow);

  return { useCase };
}
