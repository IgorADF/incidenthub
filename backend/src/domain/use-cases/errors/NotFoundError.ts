import { DefaultError } from "./_DefaultError";

export class NotFoundError extends DefaultError {
  constructor(entity?: string) {
    super(
      "NotFoundError",
      entity ? `${entity} not found` : "Resource not found",
    );
  }
}
