import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { organizationRoutes } from "./organizations";
import { authRoutes } from "./auth";
import { projectRoutes } from "./projects";
import { projectServiceRoutes } from "./project-services";
import { serviceRoutes } from "./services";
import { userRoutes } from "./users";

export async function routes(
  app: FastifyZodInstance,
  _options: FastifyPluginOptions,
) {
  app.get("/", async () => {
    return { message: "API is running!" };
  });

  await app.register(organizationRoutes);
  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(projectServiceRoutes);
  await app.register(serviceRoutes);
  await app.register(userRoutes);
}
