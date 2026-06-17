import { CreateOrganization } from "@domain/use-cases/create-organization";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateOrganization(uow);

  return { useCase };
}
