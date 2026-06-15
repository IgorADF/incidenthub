import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { Authenticateuser } from "../authenticate-user";

export function authenticateUserFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new Authenticateuser(uow);

  return { useCase };
}
