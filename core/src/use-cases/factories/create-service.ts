import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { CreateService } from "../create-service";

export function createServiceFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateService(uow);

  return { useCase };
}
