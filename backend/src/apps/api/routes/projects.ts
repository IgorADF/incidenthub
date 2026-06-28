import {
	CreateProjectInputSchema,
	CreateProjectOutputSchema,
} from "@domain/use-cases/create-project";
import { ListProjectsByOrganizationOutputSchema } from "@domain/use-cases/list-projects-by-organization";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { createProjectFactory } from "@infra/factories/create-project.usecase";
import { listProjectsByOrganizationFactory } from "@infra/factories/list-projects-by-organization.usecase";
import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { authHook } from "../plugins/auth";

export function projectRoutes(dbClient: MyPrismaClient) {
	return async (app: FastifyZodInstance, _options: FastifyPluginOptions) => {
		app.post(
			"/projects",
			{
				preHandler: [authHook],
				schema: {
					body: CreateProjectInputSchema,
					response: {
						201: z.object({ data: CreateProjectOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = createProjectFactory(dbClient);
				const data = await useCase.execute(request.user!.userId, request.body);
				return reply.status(201).send({ data });
			},
		);

		app.get(
			"/projects",
			{
				preHandler: [authHook],
				schema: {
					response: {
						200: z.object({ data: ListProjectsByOrganizationOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = listProjectsByOrganizationFactory(dbClient);
				const data = await useCase.execute(request.user!.organizationId);
				return reply.status(200).send({ data });
			},
		);
	};
}
