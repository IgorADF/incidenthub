import fastify from "fastify";
import { routes } from "./routes/_init";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

async function createApp() {
  const app = fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Test swagger",
        description: "Testing the Fastify swagger API",
        version: "0.1.0",
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

  await app.register(cors, {});

  app.register(routes);

  return { app };
}

export { createApp };
