import { DeleteService } from "@domain/use-cases/delete-service";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function deleteServiceFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new DeleteService(uow);

  return { useCase };
}
