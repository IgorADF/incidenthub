import { DefaultError } from "./_DefaultError";

export class NotAllowedError extends DefaultError {
  constructor(message?: string) {
    super(
      "NotAllowedError",
      message ?? "You are not allowed to perform this action",
    );
  }
}
