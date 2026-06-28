import type { MyPrismaClient } from "@infra/db/prisma-client";
import type { FastifyPluginOptions } from "fastify";
import type { FastifyZodInstance } from "~types/fastify-zod-instance";
import { authRoutes } from "./auth";
import { organizationRoutes } from "./organizations";
import { projectServiceRoutes } from "./project-services";
import { projectRoutes } from "./projects";
import { serviceRoutes } from "./services";
import { userRoutes } from "./users";

export function routes(dbClient: MyPrismaClient) {
	return async (app: FastifyZodInstance, _options: FastifyPluginOptions) => {
		app.get("/", async () => {
			return { message: "API is running!" };
		});

		await app.register(organizationRoutes(dbClient));
		await app.register(authRoutes(dbClient));
		await app.register(projectRoutes(dbClient));
		await app.register(projectServiceRoutes(dbClient));
		await app.register(serviceRoutes(dbClient));
		await app.register(userRoutes(dbClient));
	};
}
