import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { authenticateUserFactory } from "@infra/factories/authenticate-user.usecase";
import { forgotPasswordFactory } from "@infra/factories/forgot-password.usecase";
import {
  AuthenticateUserInputSchema,
  AuthenticateUserOutputSchema,
} from "@domain/use-cases/authenticate-user";
import {
  ForgotPasswordInputSchema,
  ForgotPasswordOutputSchema,
} from "@domain/use-cases/forgot-password";
import { NotFoundError } from "@domain/use-cases/errors/NotFoundError";
import { JwtService } from "@infra/services/jwt";
import { MyPrismaClient } from "@infra/db/prisma-client";

const jwtService = new JwtService();

export function authRoutes(dbClient: MyPrismaClient) {
  return async function (
    app: FastifyZodInstance,
    _options: FastifyPluginOptions,
  ) {
    app.post(
      "/auth/login",
      {
        schema: {
          body: AuthenticateUserInputSchema,
          response: {
            200: z.object({
              data: z.object({
                token: z.string(),
                user: AuthenticateUserOutputSchema.shape.user,
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { useCase } = authenticateUserFactory(dbClient);
        const data = await useCase.execute(request.body);

        const token = await jwtService.signAuth({
          userId: data.user.id,
          organizationId: data.user.organizationId,
          type: data.user.type,
        });

        return reply.status(200).send({
          data: {
            token,
            user: data.user,
          },
        });
      },
    );

    app.post(
      "/password/forgot",
      {
        schema: {
          body: ForgotPasswordInputSchema,
          response: {
            200: ForgotPasswordOutputSchema,
          },
        },
      },
      async (request, reply) => {
        const { useCase } = forgotPasswordFactory(dbClient);
        try {
          return reply.status(200).send(await useCase.execute(request.body));
        } catch (err) {
          if (err instanceof NotFoundError) {
            return reply.status(200).send({ sent: true });
          }
          throw err;
        }
      },
    );
  }
}
