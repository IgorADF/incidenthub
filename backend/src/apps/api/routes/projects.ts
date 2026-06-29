import {
	CreateProjectInputSchema,
	CreateProjectOutputSchema,
} from "@domain/use-cases/create-project";
import { DeleteProjectOutputSchema } from "@domain/use-cases/delete-project";
import { ListProjectsByOrganizationOutputSchema } from "@domain/use-cases/list-projects-by-organization";
import {
	UpdateProjectInputSchema,
	UpdateProjectOutputSchema,
} from "@domain/use-cases/update-project";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { createProjectFactory } from "@infra/factories/create-project.usecase";
import { deleteProjectFactory } from "@infra/factories/delete-project.usecase";
import { listProjectsByOrganizationFactory } from "@infra/factories/list-projects-by-organization.usecase";
import { updateProjectFactory } from "@infra/factories/update-project.usecase";
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

		app.patch(
			"/projects/:projectId",
			{
				preHandler: [authHook],
				schema: {
					params: z.object({ projectId: z.string().uuid() }),
					body: UpdateProjectInputSchema,
					response: {
						200: z.object({ data: UpdateProjectOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = updateProjectFactory(dbClient);
				const data = await useCase.execute(
					request.user!.userId,
					request.params.projectId,
					request.body,
				);
				return reply.status(200).send({ data });
			},
		);

		app.delete(
			"/projects/:projectId",
			{
				preHandler: [authHook],
				schema: {
					params: z.object({ projectId: z.string().uuid() }),
					response: {
						200: z.object({ data: DeleteProjectOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { useCase } = deleteProjectFactory(dbClient);
				const data = await useCase.execute(
					request.user!.userId,
					request.params.projectId,
				);
				return reply.status(200).send({ data });
			},
		);
	};
}
