import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { updateServiceFactory } from "@infra/factories/update-service.usecase";
import { toggleServiceEnabledFactory } from "@infra/factories/toggle-service-enabled.usecase";
import { deleteServiceFactory } from "@infra/factories/delete-service.usecase";
import {
  UpdateServiceInputSchema,
  UpdateServiceOutputSchema,
} from "@domain/use-cases/update-service";
import { ToggleServiceEnabledOutputSchema } from "@domain/use-cases/toggle-service-enabled";
import { DeleteServiceOutputSchema } from "@domain/use-cases/delete-service";
import { authHook } from "../plugins/auth";
import { MyPrismaClient } from "@infra/db/prisma-client";

const paramsSchema = z.object({
  serviceId: z.string().uuid(),
});

const ToggleServiceEnabledInputSchema = z.object({
  enable: z.boolean(),
});

export function serviceRoutes(dbClient: MyPrismaClient) {
  return async function (
    app: FastifyZodInstance,
    _options: FastifyPluginOptions,
  ) {
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
          response: { 200: z.object({ data: ToggleServiceEnabledOutputSchema }) },
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
  }
}
