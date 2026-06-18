import { DefaultUseCasesError } from "./_DefaultUseCasesError";

export class NotAllowedError extends DefaultUseCasesError {
  constructor(message?: string) {
    super(
      "NotAllowedError",
      message ?? "You are not allowed to perform this action",
    );
  }
}
