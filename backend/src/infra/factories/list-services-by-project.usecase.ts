import { ListServicesByProject } from "@domain/use-cases/list-services-by-project";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function listServicesByProjectFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new ListServicesByProject(uow);

  return { useCase };
}
