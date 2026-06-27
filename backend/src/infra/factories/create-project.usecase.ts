import { CreateProject } from "@domain/use-cases/create-project";
import { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function createProjectFactory(dbClient: MyPrismaClient) {
  const uow = new PrismaUOW(dbClient);
  const useCase = new CreateProject(uow);

  return { useCase };
}
