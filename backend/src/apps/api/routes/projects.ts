import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import z from "zod";
import { createProjectFactory } from "@infra/factories/create-project.usecase";
import { listProjectsByOrganizationFactory } from "@infra/factories/list-projects-by-organization.usecase";
import {
  CreateProjectInputSchema,
  CreateProjectInput,
} from "@domain/use-cases/create-project";
import { authHook } from "../plugins/auth";

export async function projectRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post<{ Body: CreateProjectInput }>(
    "/projects",
    {
      preHandler: [authHook],
      schema: {
        body: CreateProjectInputSchema,
        response: {
          201: z.object({
            id: z.string(),
            organizationId: z.string(),
            name: z.string(),
            showPublicPage: z.boolean(),
            publicPageSlug: z.string().nullable(),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = createProjectFactory();
      const { project } = await useCase.execute(
        request.user!.userId,
        request.body,
      );
      const props = project.getProps();
      return reply.status(201).send({
        id: props.id,
        organizationId: props.organizationId,
        name: props.name,
        showPublicPage: props.showPublicPage,
        publicPageSlug: props.publicPageSlug,
        createdAt: props.createdAt,
      });
    },
  );

  app.get(
    "/projects",
    {
      preHandler: [authHook],
      schema: {
        response: {
          200: z.object({
            projects: z.array(
              z.object({
                id: z.string(),
                organizationId: z.string(),
                name: z.string(),
                showPublicPage: z.boolean(),
                publicPageSlug: z.string().nullable(),
                createdAt: z.date(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { useCase } = listProjectsByOrganizationFactory();
      const { projects } = await useCase.execute(
        request.user!.organizationId,
      );
      return reply.status(200).send({
        projects: projects.map((p) => {
          const props = p.getProps();
          return {
            id: props.id,
            organizationId: props.organizationId,
            name: props.name,
            showPublicPage: props.showPublicPage,
            publicPageSlug: props.publicPageSlug,
            createdAt: props.createdAt,
          };
        }),
      });
    },
  );
}
