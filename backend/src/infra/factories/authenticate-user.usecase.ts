import { AuthenticateUser } from "@domain/use-cases/authenticate-user";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";

export function authenticateUserFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const hashPasswordService = new HashPasswordService();
	const useCase = new AuthenticateUser(uow, hashPasswordService);

	return { useCase };
}
