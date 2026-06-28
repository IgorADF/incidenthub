import { DefaultUseCasesError } from "./_DefaultUseCasesError";

export class NotFoundError extends DefaultUseCasesError {
	constructor(entity?: string) {
		super(
			"NotFoundError",
			entity ? `${entity} not found` : "Resource not found",
		);
	}
}
