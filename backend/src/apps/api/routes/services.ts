import { DeleteServiceOutputSchema } from "@domain/use-cases/delete-service";
import { ListHealthChecksByServiceOutputSchema } from "@domain/use-cases/list-health-checks-by-service";
import { ToggleServiceEnabledOutputSchema } from "@domain/use-cases/toggle-service-enabled";
import {
	UpdateServiceInputSchema,
	UpdateServiceOutputSchema,
} from "@domain/use-cases/update-service";
import {
	LimitPagination,
	ListCursor,
} from "@domain/use-cases/utils/paginations/pagination";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { deleteServiceFactory } from "@infra/factories/delete-service.usecase";
import { listHealthChecksByServiceFactory } from "@infra/factories/list-health-checks-by-service.usecase";
import { toggleServiceEnabledFactory } from "@infra/factories/toggle-service-enabled.usecase";
import { updateServiceFactory } from "@infra/factories/update-service.usecase";
import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { authHook } from "../plugins/auth";

const paramsSchema = z.object({
	serviceId: z.string().uuid(),
});

const ToggleServiceEnabledInputSchema = z.object({
	enable: z.boolean(),
});

export function serviceRoutes(dbClient: MyPrismaClient) {
	return async (app: FastifyZodInstance, _options: FastifyPluginOptions) => {
		app.put(
			"/services/:serviceId",
			{
				preHandler: [authHook],
				schema: {
					params: paramsSchema,
					body: UpdateServiceInputSchema,
					response: { 200: z.object({ data: UpdateServiceOutputSchema }) },
				},
			},
			async (request, reply) => {
				const { serviceId } = request.params;
				const { useCase } = updateServiceFactory(dbClient);
				const data = await useCase.execute(
					request.user!.userId,
					serviceId,
					request.body,
				);
				return reply.status(200).send({ data });
			},
		);

		app.patch(
			"/services/:serviceId/enabled",
			{
				preHandler: [authHook],
				schema: {
					params: paramsSchema,
					body: ToggleServiceEnabledInputSchema,
					response: {
						200: z.object({ data: ToggleServiceEnabledOutputSchema }),
					},
				},
			},
			async (request, reply) => {
				const { serviceId } = request.params;
				const { useCase } = toggleServiceEnabledFactory(dbClient);
				const data = await useCase.execute(
					request.user!.userId,
					serviceId,
					request.body.enable,
				);
				return reply.status(200).send({ data });
			},
		);

		app.delete(
			"/services/:serviceId",
			{
				preHandler: [authHook],
				schema: {
					params: paramsSchema,
					response: { 200: DeleteServiceOutputSchema },
				},
			},
			async (request, reply) => {
				const { serviceId } = request.params;
				const { useCase } = deleteServiceFactory(dbClient);
				const { deleted } = await useCase.execute(
					request.user!.userId,
					serviceId,
				);
				return reply.status(200).send({ deleted });
			},
		);

		app.get(
			"/services/:serviceId/health-checks",
			{
				preHandler: [authHook],
				schema: {
					params: paramsSchema,
					querystring: z.object({
						limit: z.preprocess(
							(value) => (value === undefined ? undefined : Number(value)),
							LimitPagination,
						),
						id: ListCursor.shape.id.optional().default(null),
					}),
					response: {
						200: z.object({
							data: ListHealthChecksByServiceOutputSchema,
						}),
					},
				},
			},
			async (request, reply) => {
				const { serviceId } = request.params;
				const { useCase } = listHealthChecksByServiceFactory(dbClient);
				const data = await useCase.execute(request.user!.userId, serviceId, {
					limit: request.query.limit,
					cursor: { id: request.query.id },
				});
				return reply.status(200).send({ data });
			},
		);
	};
}
