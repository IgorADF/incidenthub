import { prismaClient } from "../../db/prisma-client";
import { PrismaUOW } from "../../repositories/prisma/_uow";
import { AuthenticateUser } from "../authenticate-user";

export function authenticateUserFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new AuthenticateUser(uow);

  return { useCase };
}
