import { AuthenticateUser } from "@domain/use-cases/authenticate-user";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";

export function authenticateUserFactory() {
  const uow = new PrismaUOW(prismaClient);
  const useCase = new AuthenticateUser(uow);

  return { useCase };
}
