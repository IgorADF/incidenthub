import { ListAllDueServices } from "@domain/use-cases/list-all-due-services";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listAllDueServicesFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new ListAllDueServices(uow);

  return { useCase };
}
