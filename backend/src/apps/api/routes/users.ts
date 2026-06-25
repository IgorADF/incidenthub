import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import { createUserToOrganizationFactory } from "@infra/factories/create-user-to-organization.usecase";
import { CreateUserToOrganizationInputSchema } from "@domain/use-cases/create-user-to-organization";
import { authHook } from "../plugins/auth";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";

export async function userRoutes(
  app: FastifyZodInstance,
  _options: FastifyPluginOptions,
) {
  app.post(
    "/users",
    {
      preHandler: [authHook],
      schema: {
        body: CreateUserToOrganizationInputSchema,
        response: {
          201: z.object({
            id: z.string(),
            organizationId: z.string(),
            name: z.string(),
            email: z.string(),
            type: z.enum(["ADMIN", "DEV"]),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createUserToOrganizationFactory();
      const { user } = await useCase.execute(
        request.user!.userId,
        request.body,
      );
      const props = user.getProps();
      return reply.status(201).send({
        id: props.id,
        organizationId: props.organizationId,
        name: props.name,
        email: props.email,
        type: props.type,
        createdAt: props.createdAt,
      });
    },
  );
}
