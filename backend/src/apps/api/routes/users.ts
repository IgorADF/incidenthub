import {
	CreateUserToOrganizationInputSchema,
	CreateUserToOrganizationOutputSchema,
} from "@domain/use-cases/create-user-to-organization";
import { ListUsersByOrganizationOutputSchema } from "@domain/use-cases/list-users-by-organization";
import { ListUserCursor } from "@domain/use-cases/utils/paginations/list-user-by-organization";
import { LimitPagination } from "@domain/use-cases/utils/paginations/pagination";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { createUserToOrganizationFactory } from "@infra/factories/create-user-to-organization.usecase";
import { listUsersByOrganizationFactory } from "@infra/factories/list-users-by-organization.usecase";
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

		app.get(
			"/users",
			{
				preHandler: [authHook],
				schema: {
					querystring: z.object({
						limit: z.preprocess(
							(value) => (value === undefined ? undefined : Number(value)),
							LimitPagination,
						),
						normalizedName: ListUserCursor.shape.normalizedName
							.optional()
							.default(null),
						id: ListUserCursor.shape.id.optional().default(null),
					}),
					response: {
						200: z.object({ data: ListUsersByOrganizationOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = listUsersByOrganizationFactory(dbClient);
				const data = await useCase.execute(request.user!.userId, {
					limit: request.query.limit,
					cursor: {
						normalizedName: request.query.normalizedName,
						id: request.query.id,
					},
				});
				return reply.status(200).send({ data });
			},
		);
	};
}
