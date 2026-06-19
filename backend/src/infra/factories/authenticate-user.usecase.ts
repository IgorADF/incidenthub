import { AuthenticateUser } from "@domain/use-cases/authenticate-user";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function authenticateUserFactory() {
  const uow = new PrismaUOW(prismaClient);
  const hashPasswordService = new HashPasswordService();
  const useCase = new AuthenticateUser(uow, hashPasswordService);

  return { useCase };
}
