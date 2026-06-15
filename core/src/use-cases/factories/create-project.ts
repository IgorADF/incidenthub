import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { Createproject } from "../create-project";

export function createProjectFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new Createproject(uow);

  return { useCase };
}
