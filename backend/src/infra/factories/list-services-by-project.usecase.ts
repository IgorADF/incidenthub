import { ListServicesByProject } from "@domain/use-cases/list-services-by-project";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listServicesByProjectFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new ListServicesByProject(uow);

  return { useCase };
}
