import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createOrganizationFactory } from "@infra/factories/create-organization.usecase";
import {
  CreateOrganizationInputSchema,
} from "@domain/use-cases/create-organization";
import { EntityAlreadyExists } from "@domain/use-cases/errors/EntityAlreadyExists";

export async function organizationRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.post("/organizations", async (request, reply) => {
    const parsed = CreateOrganizationInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    }

    const { useCase } = createOrganizationFactory();

    try {
      const { organization, user } = await useCase.execute(parsed.data);

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
    } catch (err) {
      if (err instanceof EntityAlreadyExists) {
        return reply.status(409).send({
          code: err.code,
          message: err.message,
          context: err.context,
        });
      }

      throw err;
    }
  });
}
