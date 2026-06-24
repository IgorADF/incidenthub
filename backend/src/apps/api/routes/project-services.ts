import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import z from "zod";
import { createServiceFactory } from "@infra/factories/create-service.usecase";
import { listServicesByProjectFactory } from "@infra/factories/list-services-by-project.usecase";
import { CreateServiceInputSchema } from "@domain/use-cases/create-service";
import { authHook } from "../plugins/auth";
import { serviceResponseSchema } from "./_schemas";

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export async function projectServiceRoutes(
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
        response: { 201: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const projectId = request.params.projectId;
      const { useCase } = createServiceFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        projectId,
        request.body,
      );
      const props = service.getProps();
      return reply.status(201).send({
        id: props.id,
        projectId: props.projectId,
        name: props.name,
        url: props.url,
        intervalSeconds: props.intervalSeconds,
        timeoutSeconds: props.timeoutSeconds,
        expectedResponseStatus: props.expectedResponseStatus,
        incidentDetectionFails: props.incidentDetectionFails,
        emailToAlert: props.emailToAlert,
        enabled: props.enabled,
        currentIncidentId: props.currentIncidentId,
        createdAt: props.createdAt,
      });
    },
  );

  app.get(
    "/projects/:projectId/services",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        response: { 200: z.object({ services: z.array(serviceResponseSchema) }) },
      },
    },
    async (request, reply) => {
      const projectId = request.params.projectId;
      const { useCase } = listServicesByProjectFactory();
      const { services } = await useCase.execute(
        request.user!.organizationId,
        projectId,
      );
      return reply.status(200).send({
        services: services.map((s) => {
          const props = s.getProps();
          return {
            id: props.id,
            projectId: props.projectId,
            name: props.name,
            url: props.url,
            intervalSeconds: props.intervalSeconds,
            timeoutSeconds: props.timeoutSeconds,
            expectedResponseStatus: props.expectedResponseStatus,
            incidentDetectionFails: props.incidentDetectionFails,
            emailToAlert: props.emailToAlert,
            enabled: props.enabled,
            currentIncidentId: props.currentIncidentId,
            createdAt: props.createdAt,
          };
        }),
      });
    },
  );
}
