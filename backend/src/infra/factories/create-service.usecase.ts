import { CreateService } from "@domain/use-cases/create-service";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createServiceFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateService(uow);

  return { useCase };
}
