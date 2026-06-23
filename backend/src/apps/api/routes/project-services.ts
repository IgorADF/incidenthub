import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createServiceFactory } from "@infra/factories/create-service.usecase";
import { listServicesByProjectFactory } from "@infra/factories/list-services-by-project.usecase";
import {
  CreateServiceInputSchema,
  CreateServiceInput,
} from "@domain/use-cases/create-service";
import { authHook } from "../plugins/auth";

const serviceResponseSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  url: z.string(),
  intervalSeconds: z.number().int(),
  timeoutSeconds: z.number().int(),
  expectedResponseStatus: z.number().int(),
  incidentDetectionFails: z.number().int(),
  emailToAlert: z.string().nullable(),
  enabled: z.boolean(),
  currentIncidentId: z.string().nullable(),
  createdAt: z.date(),
});

const paramsSchema = z.object({
  projectId: z.string().uuid(),
});

export async function projectServiceRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post<{ Params: { projectId: string }; Body: CreateServiceInput }>(
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

  app.get<{ Params: { projectId: string } }>(
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
      const { services } = await useCase.execute(projectId);
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
