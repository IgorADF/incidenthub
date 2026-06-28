import { DefaultEntitiesError } from "@domain/entities/errors/_DefaultEntitiesError";
import { ValidationEntitiesError } from "@domain/entities/errors/ValidationEntitiesError";
import { DefaultUseCasesError } from "@domain/use-cases/errors/_DefaultUseCasesError";
import { EntityAlreadyExists } from "@domain/use-cases/errors/EntityAlreadyExists";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	isResponseSerializationError,
} from "fastify-type-provider-zod";

const HTTP_STATUS_BY_DOMAIN_ERROR_CODE = {
	EntityAlreadyExists: 409,
	NotAllowedError: 403,
	NotFoundError: 404,
	LimitExceededError: 409,
	InvalidCredentialError: 401,
	ValidationEntitiesError: 400,
} as const;

function statusForDomainError(
	error: DefaultUseCasesError | DefaultEntitiesError,
): number {
	return (
		HTTP_STATUS_BY_DOMAIN_ERROR_CODE[
			error.code as keyof typeof HTTP_STATUS_BY_DOMAIN_ERROR_CODE
		] ?? 400
	);
}

export function errorHandler(
	error: unknown,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	if (hasZodFastifySchemaValidationErrors(error)) {
		return reply.status(400).send({
			code: "VALIDATION_ERROR",
			message: "Request doesn't match the schema",
			details: error.validation,
		});
	}

	if (isResponseSerializationError(error)) {
		return reply.status(500).send({
			code: "INTERNAL_ERROR",
			message: "Response doesn't match the schema",
			details: error.cause.issues,
		});
	}

	if (error instanceof EntityAlreadyExists) {
		const body: Record<string, unknown> = {
			code: error.code,
			message: error.message,
		};
		if (error.context) {
			body.context = error.context;
		}
		return reply.status(statusForDomainError(error)).send(body);
	}

	if (error instanceof ValidationEntitiesError) {
		return reply
			.status(statusForDomainError(error))
			.send({ code: error.code, message: error.message, issues: error.issues });
	}

	if (
		error instanceof DefaultUseCasesError ||
		error instanceof DefaultEntitiesError
	) {
		return reply
			.status(statusForDomainError(error))
			.send({ code: error.code, message: error.message });
	}

	request.log.error(error);
	return reply
		.status(500)
		.send({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
