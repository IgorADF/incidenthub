import { UpdateService } from "@domain/use-cases/update-service";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function updateServiceFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new UpdateService(uow);

  return { useCase };
}
