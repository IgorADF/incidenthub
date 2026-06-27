import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { createOrganizationFactory } from "@infra/factories/create-organization.usecase";
import {
  CreateOrganizationInputSchema,
  CreateOrganizationOutputSchema,
} from "@domain/use-cases/create-organization";
import { MyPrismaClient } from "@infra/db/prisma-client";

export function organizationRoutes(dbClient: MyPrismaClient) {
  return async function (
    app: FastifyZodInstance,
    _options: FastifyPluginOptions,
  ) {
    app.post(
      "/organizations",
      {
        schema: {
          body: CreateOrganizationInputSchema,
          response: {
            201: z.object({ data: CreateOrganizationOutputSchema }),
          },
        },
      },
      async (request, reply) => {
        const { useCase } = createOrganizationFactory(dbClient);
        const data = await useCase.execute(request.body);
        return reply.status(201).send({ data });
      },
    );
  }

}