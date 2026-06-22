import { DefaultUseCasesError } from "./_DefaultUseCasesError";

export class ValidationUseCasesError extends DefaultUseCasesError {
  constructor(message?: string) {
    super("ValidationUseCasesError", message ?? "Validation failed");
  }
}
