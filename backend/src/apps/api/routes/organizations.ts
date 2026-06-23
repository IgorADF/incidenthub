import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createOrganizationFactory } from "@infra/factories/create-organization.usecase";
import { CreateOrganizationInputSchema, CreateOrganizationInput } from "@domain/use-cases/create-organization";

export async function organizationRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post<{ Body: CreateOrganizationInput }>(
    "/organizations",
    {
      schema: {
        body: CreateOrganizationInputSchema,
        response: {
          201: z.object({
            organization: z.object({
              id: z.string(),
              name: z.string(),
              createdAt: z.date(),
            }),
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
      const { useCase } = createOrganizationFactory();
      const { organization, user } = await useCase.execute(request.body);

      const orgProps = organization.getProps();
      const userProps = user.getProps();

      return reply.status(201).send({
        organization: {
          id: orgProps.id,
          name: orgProps.name,
          createdAt: orgProps.createdAt,
        },
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
}