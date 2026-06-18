import { DefaultUseCasesError } from "./_DefaultUseCasesError";

export class InvalidCredentialError extends DefaultUseCasesError {
  constructor(message?: string) {
    super("InvalidCredentialError", message ?? "Invalid credential(s)");
  }
}
