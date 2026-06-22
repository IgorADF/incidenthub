import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { organizationRoutes } from "./organizations";

export async function routes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  app.get("/", async () => {
    return { message: "API is running!" };
  });

  await app.register(organizationRoutes);
}
