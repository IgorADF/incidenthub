import { CreateService } from "@domain/use-cases/create-service";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createServiceFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new CreateService(uow);

  return { useCase };
}
