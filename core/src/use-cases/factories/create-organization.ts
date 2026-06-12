import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { Createorganization } from "../create-organization";

export function createOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new Createorganization(uow);

  return { useCase };
}
