import type { FastifyReply, FastifyRequest } from "fastify";
import { JwtService } from "@infra/services/jwt";

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

export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const jwtService = new JwtService();
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
