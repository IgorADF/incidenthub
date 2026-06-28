import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export type FastifyZodInstance = FastifyInstance<
	Server<typeof IncomingMessage, typeof ServerResponse>,
	IncomingMessage,
	ServerResponse<IncomingMessage>,
	FastifyBaseLogger,
	ZodTypeProvider
>;
