import { DefaultUseCasesError } from "./_DefaultUseCasesError";

export class LimitExceededError extends DefaultUseCasesError {
  constructor(message?: string) {
    super("LimitExceededError", message ?? "Limit exceeded for this resource");
  }
}
