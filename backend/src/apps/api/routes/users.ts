import {
	CreateUserToOrganizationInputSchema,
	CreateUserToOrganizationOutputSchema,
} from "@domain/use-cases/create-user-to-organization";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { createUserToOrganizationFactory } from "@infra/factories/create-user-to-organization.usecase";
import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { authHook } from "../plugins/auth";

export function userRoutes(dbClient: MyPrismaClient) {
	return async (app: FastifyZodInstance, _options: FastifyPluginOptions) => {
		app.post(
			"/users",
			{
				preHandler: [authHook],
				schema: {
					body: CreateUserToOrganizationInputSchema,
					response: {
						201: z.object({ data: CreateUserToOrganizationOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = createUserToOrganizationFactory(dbClient);
				const data = await useCase.execute(request.user!.userId, request.body);
				return reply.status(201).send({ data });
			},
		);
	};
}
