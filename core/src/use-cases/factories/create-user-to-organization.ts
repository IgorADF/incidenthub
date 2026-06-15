import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { Createusertoorganization } from "../create-user-to-organization";

export function createUserToOrganizationFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new Createusertoorganization(uow);

  return { useCase };
}
