import { DefaultError } from "./_DefaultError";

export class InvalidCredentialError extends DefaultError {
  constructor(message?: string) {
    super("InvalidCredentialError", message ?? "Invalid credential(s)");
  }
}
