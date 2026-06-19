import { _DefaultEntitiesError } from "./_DefaultEntitiesError";

export type ValidationIssue = {
  path: string;
  message: string;
};

export class ValidationError extends _DefaultEntitiesError {
  public readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super("ValidationError", ValidationError.formatMessage(issues));
    this.issues = issues;
  }

  private static formatMessage(issues: ValidationIssue[]): string {
    return issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
  }
}
