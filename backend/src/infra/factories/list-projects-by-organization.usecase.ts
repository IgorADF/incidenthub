import { ListProjectsByOrganization } from "@domain/use-cases/list-projects-by-organization";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listProjectsByOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new ListProjectsByOrganization(uow);

  return { useCase };
}
