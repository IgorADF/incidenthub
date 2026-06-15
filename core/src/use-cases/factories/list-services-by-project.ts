import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { ListServicesByProject } from "../list-services-by-project";

export function listServicesByProjectFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new ListServicesByProject(uow);

  return { useCase };
}
