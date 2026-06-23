import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { updateServiceFactory } from "@infra/factories/update-service.usecase";
import { toggleServiceEnabledFactory } from "@infra/factories/toggle-service-enabled.usecase";
import { deleteServiceFactory } from "@infra/factories/delete-service.usecase";
import {
  UpdateServiceInputSchema,
  UpdateServiceInput,
} from "@domain/use-cases/update-service";
import { authHook } from "../plugins/auth";

const paramsSchema = z.object({
  serviceId: z.string().uuid(),
});

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

const ToggleServiceEnabledInputSchema = z.object({
  enable: z.boolean(),
});
type ToggleServiceEnabledInput = z.infer<typeof ToggleServiceEnabledInputSchema>;

export async function serviceRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.put<{ Params: { serviceId: string }; Body: UpdateServiceInput }>(
    "/services/:serviceId",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        body: UpdateServiceInputSchema,
        response: { 200: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params;
      const { useCase } = updateServiceFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        serviceId,
        request.body,
      );
      const props = service.getProps();
      return reply.status(200).send({
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

  app.patch<{ Params: { serviceId: string }; Body: ToggleServiceEnabledInput }>(
    "/services/:serviceId/enabled",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        body: ToggleServiceEnabledInputSchema,
        response: { 200: serviceResponseSchema },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params;
      const { useCase } = toggleServiceEnabledFactory();
      const { service } = await useCase.execute(
        request.user!.userId,
        serviceId,
        request.body.enable,
      );
      const props = service.getProps();
      return reply.status(200).send({
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

  app.delete<{ Params: { serviceId: string } }>(
    "/services/:serviceId",
    {
      preHandler: [authHook],
      schema: {
        params: paramsSchema,
        response: { 200: z.object({ deleted: z.boolean() }) },
      },
    },
    async (request, reply) => {
      const { serviceId } = request.params;
      const { useCase } = deleteServiceFactory();
      const { deleted } = await useCase.execute(
        request.user!.userId,
        serviceId,
      );
      return reply.status(200).send({ deleted });
    },
  );
}
