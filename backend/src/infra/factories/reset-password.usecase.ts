import type { MyPrismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { HashPasswordService } from "@infra/services/hash-password";
import { JwtService } from "@infra/services/jwt";
import { ResetPassword } from "@domain/use-cases/reset-password";

export function resetPasswordFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const jwtService = new JwtService();
	const hashPasswordService = new HashPasswordService();
	const useCase = new ResetPassword(uow, jwtService, hashPasswordService);

	return { useCase };
}