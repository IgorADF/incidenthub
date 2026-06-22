import { ForgotPassword } from "@domain/use-cases/forgot-password";
import { prismaClient } from "@infra/db/prisma-client";
import { PrismaUOW } from "@infra/repositories/prisma/_uow";
import { EmailService } from "@infra/services/email";
import { JwtService } from "@infra/services/jwt";
import { envs } from "@infra/envs";

export function forgotPasswordFactory() {
  const uow = new PrismaUOW(prismaClient);
  const emailService = new EmailService();
  const jwtService = new JwtService();
  const useCase = new ForgotPassword(uow, emailService, jwtService, envs.UI_URL);

  return { useCase };
}
