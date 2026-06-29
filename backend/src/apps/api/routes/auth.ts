import {
	AuthenticateUserInputSchema,
	AuthenticateUserOutputSchema,
} from "@domain/use-cases/authenticate-user";
import { NotFoundError } from "@domain/use-cases/errors/NotFoundError";
import {
	ForgotPasswordInputSchema,
	ForgotPasswordOutputSchema,
} from "@domain/use-cases/forgot-password";
import {
	ResetPasswordInputSchema,
	ResetPasswordOutputSchema,
} from "@domain/use-cases/reset-password";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { authenticateUserFactory } from "@infra/factories/authenticate-user.usecase";
import { forgotPasswordFactory } from "@infra/factories/forgot-password.usecase";
import { resetPasswordFactory } from "@infra/factories/reset-password.usecase";
import { JwtService } from "@infra/services/jwt";
import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

const jwtService = new JwtService();

export function authRoutes(dbClient: MyPrismaClient) {
	return async (app: FastifyZodInstance, _options: FastifyPluginOptions) => {
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

		app.post(
			"/password/reset",
			{
				schema: {
					body: ResetPasswordInputSchema,
					response: {
						200: ResetPasswordOutputSchema,
					},
				},
			},
			async (request, reply) => {
				const { useCase } = resetPasswordFactory(dbClient);
				return reply
					.status(200)
					.send(await useCase.execute(request.body));
			},
		);
	};
}
