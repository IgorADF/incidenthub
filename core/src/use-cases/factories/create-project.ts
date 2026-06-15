import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { CreateProject } from "../create-project";

export function createProjectFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateProject(uow);

  return { useCase };
}
