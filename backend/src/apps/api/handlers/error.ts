import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { DefaultUseCasesError } from "@domain/use-cases/errors/_DefaultUseCasesError";
import { EntityAlreadyExists } from "@domain/use-cases/errors/EntityAlreadyExists";
import { NotAllowedError } from "@domain/use-cases/errors/NotAllowedError";
import { NotFoundError } from "@domain/use-cases/errors/NotFoundError";
import { LimitExceededError } from "@domain/use-cases/errors/LimitExceededError";
import { InvalidCredentialError } from "@domain/use-cases/errors/InvalidCredentialError";

export function errorHandler(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  }

  if (error instanceof InvalidCredentialError) {
    return reply.status(401).send({ code: error.code, message: error.message });
  }

  if (error instanceof NotAllowedError) {
    return reply.status(403).send({ code: error.code, message: error.message });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({ code: error.code, message: error.message });
  }

  if (
    error instanceof EntityAlreadyExists ||
    error instanceof LimitExceededError
  ) {
    const body: Record<string, unknown> = {
      code: error.code,
      message: error.message,
    };
    if (error instanceof EntityAlreadyExists && error.context) {
      body.context = error.context;
    }
    return reply.status(409).send(body);
  }

  if (error instanceof DefaultUseCasesError) {
    return reply.status(400).send({ code: error.code, message: error.message });
  }

  request.log.error(error);
  return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
