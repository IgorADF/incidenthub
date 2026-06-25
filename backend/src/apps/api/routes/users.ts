import type { FastifyPluginOptions } from "fastify";
import z from "zod";
import { createUserToOrganizationFactory } from "@infra/factories/create-user-to-organization.usecase";
import {
  CreateUserToOrganizationInputSchema,
  CreateUserToOrganizationOutputSchema,
} from "@domain/use-cases/create-user-to-organization";
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
          201: z.object({ data: CreateUserToOrganizationOutputSchema }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createUserToOrganizationFactory();
      const data = await useCase.execute(
        request.user!.userId,
        request.body,
      );
      return reply.status(201).send({ data });
    },
  );
}
