import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { MyPrismaClient } from "@infra/db/prisma-client";
import { envs } from "@infra/envs";
import fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { errorHandler } from "./handlers/error";
import { routes } from "./routes/_init";

export async function createApp(prismaClient: MyPrismaClient) {
	const app = fastify({
		logger: envs.isDevEnv
			? {
					level: "info",
					transport: {
						target: "pino-pretty",
						options: {
							colorize: true,
							translateTime: "SYS:standard",
							ignore: "pid,hostname",
						},
					},
				}
			: false,
	}).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);
	app.setErrorHandler(errorHandler);

	await app.register(swagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "IncidentHub API",
				description: "Operational platform API for service health monitoring",
				version: "1.0.0",
			},
			// servers: [
			//   {
			//     url: "http://localhost:3000",
			//     description: "Development server",
			//   },
			// ],
			// tags: [
			//   { name: "user", description: "User related end-points" },
			//   { name: "code", description: "Code related end-points" },
			// ],
			// components: {
			//   securitySchemes: {
			//     apiKey: {
			//       type: "apiKey",
			//       name: "apiKey",
			//       in: "header",
			//     },
			//   },
			// },
		},
		transform: jsonSchemaTransform,
	});

	await app.register(swaggerUi, {
		routePrefix: "/documentation",
		uiConfig: {
			docExpansion: "full",
			deepLinking: false,
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, request, reply) => {
			return swaggerObject;
		},
		transformSpecificationClone: true,
	});

	await app.register(cookie, { secret: envs.AUTH_JWT_SECRET });

	await app.register(cors, {
		credentials: true,
		origin: [envs.UI_URL],
	});

	app.register(routes(prismaClient));

	return { app };
}
