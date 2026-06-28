import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { createServiceFactory } from "@infra/factories/create-service.usecase";
import { listServicesByProjectFactory } from "@infra/factories/list-services-by-project.usecase";
import {
  CreateServiceInputSchema,
  CreateServiceOutputSchema,
} from "@domain/use-cases/create-service";
import { ListServicesByProjectOutputSchema } from "@domain/use-cases/list-services-by-project";
import { authHook } from "../plugins/auth";
import { MyPrismaClient } from "@infra/db/prisma-client";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export function projectServiceRoutes(dbClient: MyPrismaClient) {
  return async function (
    app: FastifyZodInstance,
    _options: FastifyPluginOptions,
  ) {
    app.post(
      "/projects/:projectId/services",
      {
        preHandler: [authHook],
        schema: {
          params: paramsSchema,
          body: CreateServiceInputSchema,
          response: { 201: z.object({ data: CreateServiceOutputSchema }) },
        },
      },
      async (request, reply) => {
        const projectId = request.params.projectId;
        const { useCase } = createServiceFactory(dbClient);
        const data = await useCase.execute(
          request.user!.userId,
          projectId,
          request.body,
        );
        return reply.status(201).send({ data });
      },
    );

    app.get(
      "/projects/:projectId/services",
      {
        preHandler: [authHook],
        schema: {
          params: paramsSchema,
          response: {
            200: z.object({ data: ListServicesByProjectOutputSchema }),
          },
        },
      },
      async (request, reply) => {
        const projectId = request.params.projectId;
        const { useCase } = listServicesByProjectFactory(dbClient);
        const data = await useCase.execute(request.user!.userId, projectId);
        return reply.status(200).send({ data });
      },
    );
  }
}
