import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { authenticateUserFactory } from "@infra/factories/authenticate-user.usecase";
import { forgotPasswordFactory } from "@infra/factories/forgot-password.usecase";
import { AuthenticateUserInputSchema, AuthenticateUserInput } from "@domain/use-cases/authenticate-user";
import { ForgotPasswordInputSchema, ForgotPasswordInput } from "@domain/use-cases/forgot-password";
import { JwtService } from "@infra/services/jwt";

const jwtService = new JwtService();

export async function authRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post<{ Body: AuthenticateUserInput }>(
    "/auth/login",
    {
      schema: {
        body: AuthenticateUserInputSchema,
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              organizationId: z.string(),
              name: z.string(),
              email: z.string(),
              type: z.enum(["ADMIN", "DEV"]),
              createdAt: z.date(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = authenticateUserFactory();
      const { user } = await useCase.execute(request.body);
      const userProps = user.getProps();

      const token = await jwtService.signAuth({
        userId: userProps.id,
        organizationId: userProps.organizationId,
        type: userProps.type,
      });

      return reply.status(200).send({
        token,
        user: {
          id: userProps.id,
          organizationId: userProps.organizationId,
          name: userProps.name,
          email: userProps.email,
          type: userProps.type,
          createdAt: userProps.createdAt,
        },
      });
    },
  );

  app.post<{ Body: ForgotPasswordInput }>(
    "/password/forgot",
    {
      schema: {
        body: ForgotPasswordInputSchema,
        response: {
          200: z.object({ sent: z.boolean() }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = forgotPasswordFactory();
      await useCase.execute(request.body);
      return reply.status(200).send({ sent: true });
    },
  );
}