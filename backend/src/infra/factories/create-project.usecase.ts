import { CreateProject } from "@domain/use-cases/create-project";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createProjectFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateProject(uow);

  return { useCase };
}
