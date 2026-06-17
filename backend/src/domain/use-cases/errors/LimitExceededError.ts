import { DefaultError } from "./_DefaultError";

export class LimitExceededError extends DefaultError {
  constructor(message?: string) {
    super(
      "LimitExceededError",
      message ?? "Limit exceeded for this resource",
    );
  }
}
