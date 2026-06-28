import { ListProjectsByOrganization } from "@domain/use-cases/list-projects-by-organization";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listProjectsByOrganizationFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new ListProjectsByOrganization(uow);

  return { useCase };
}
