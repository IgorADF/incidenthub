import { _DefaultEntitiesError } from "./_DefaultEntitiesError";

export class ValidationError extends _DefaultEntitiesError {
  constructor(message: string) {
    super("ValidationError", message);
  }
}
