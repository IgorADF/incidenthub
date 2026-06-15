import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { CreateUserToOrganization } from "../create-user-to-organization";

export function createUserToOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new CreateUserToOrganization(uow);

  return { useCase };
}
