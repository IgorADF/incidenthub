import { DefaultEntitiesError } from "./_DefaultEntitiesError";

export type ValidationIssue = {
	path: string;
	message: string;
};

export class ValidationEntitiesError extends DefaultEntitiesError {
	public readonly issues: ValidationIssue[];

	constructor(issues: ValidationIssue[]) {
		super(
			"ValidationEntitiesError",
			ValidationEntitiesError.formatMessage(issues),
		);
		this.issues = issues;
	}

	private static formatMessage(issues: ValidationIssue[]): string {
		return issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
	}
}
