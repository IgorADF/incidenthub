import { UpdateService } from "@domain/use-cases/update-service";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function updateServiceFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new UpdateService(uow);

  return { useCase };
}
