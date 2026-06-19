import { CreateOrganization } from "@domain/use-cases/create-organization";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function createOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const hashPasswordService = new HashPasswordService();
  const useCase = new CreateOrganization(uow, hashPasswordService);

  return { useCase };
}
