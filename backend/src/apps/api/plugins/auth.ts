import { JwtService } from "@infra/services/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

const jwtService = new JwtService();

export type AuthUser = {
	userId: string;
	organizationId: string;
	type: "ADMIN" | "DEV";
};

declare module "fastify" {
	interface FastifyRequest {
		user: AuthUser | null;
	}
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
	const header = request.headers.authorization;

	if (!header) {
		return reply.status(401).send({
			code: "UNAUTHORIZED",
			message: "Missing or invalid Authorization header",
		});
	}

	const match = /^(\S+)\s+(.+)$/i.exec(header);
	if (!match || match[1].toLowerCase() !== "bearer") {
		return reply.status(401).send({
			code: "UNAUTHORIZED",
			message: "Missing or invalid Authorization header",
		});
	}

	const token = match[2].trim();

	try {
		const payload = await jwtService.verifyAuth(token);
		request.user = {
			userId: payload.userId,
			organizationId: payload.organizationId,
			type: payload.type,
		};
	} catch {
		return reply.status(401).send({
			code: "UNAUTHORIZED",
			message: "Invalid or expired token",
		});
	}
}
