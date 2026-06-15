import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { CreateOrganization } from "../create-organization";

export function createOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateOrganization(uow);

  return { useCase };
}
