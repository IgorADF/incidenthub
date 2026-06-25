import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { createProjectFactory } from "@infra/factories/create-project.usecase";
import { listProjectsByOrganizationFactory } from "@infra/factories/list-projects-by-organization.usecase";
import {
  CreateProjectInputSchema,
  CreateProjectOutputSchema,
} from "@domain/use-cases/create-project";
import { ListProjectsByOrganizationOutputSchema } from "@domain/use-cases/list-projects-by-organization";
import { authHook } from "../plugins/auth";

export async function projectRoutes(
  app: FastifyZodInstance,
  _options: FastifyPluginOptions,
) {
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
      const { useCase } = createProjectFactory();
      const data = await useCase.execute(
        request.user!.userId,
        request.body,
      );
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
      const { useCase } = listProjectsByOrganizationFactory();
      const data = await useCase.execute(
        request.user!.organizationId,
      );
      return reply.status(200).send({ data });
    },
  );
}
