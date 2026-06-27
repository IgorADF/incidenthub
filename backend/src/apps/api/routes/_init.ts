import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { organizationRoutes } from "./organizations";
import { authRoutes } from "./auth";
import { projectRoutes } from "./projects";
import { projectServiceRoutes } from "./project-services";
import { serviceRoutes } from "./services";
import { userRoutes } from "./users";
import { MyPrismaClient } from "@infra/db/prisma-client";

export function routes(dbClient: MyPrismaClient) {
  return async function (
    app: FastifyZodInstance,
    _options: FastifyPluginOptions,
  ) {
    app.get("/", async () => {
      return { message: "API is running!" };
    });

    await app.register(organizationRoutes(dbClient));
    await app.register(authRoutes(dbClient));
    await app.register(projectRoutes(dbClient));
    await app.register(projectServiceRoutes(dbClient));
    await app.register(serviceRoutes(dbClient));
    await app.register(userRoutes(dbClient));
  }

}