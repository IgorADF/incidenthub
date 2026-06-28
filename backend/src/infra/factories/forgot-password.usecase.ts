import { ForgotPassword } from "@domain/use-cases/forgot-password";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { envs } from "@infra/envs";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { EmailService } from "@infra/services/email";
import { JwtService } from "@infra/services/jwt";

export function forgotPasswordFactory(dbClient: MyPrismaClient) {
	const uow = new PrismaUOW(dbClient);
	const emailService = new EmailService();
	const jwtService = new JwtService();
	const useCase = new ForgotPassword(
		uow,
		emailService,
		jwtService,
		envs.UI_URL,
	);

	return { useCase };
}
