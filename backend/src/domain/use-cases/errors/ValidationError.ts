import { DefaultError } from "./_DefaultError";

export class ValidationError extends DefaultError {
  constructor(message: string) {
    super("ValidationError", message);
  }
}
