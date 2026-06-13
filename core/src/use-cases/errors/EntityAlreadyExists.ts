import { DefaultError } from "./_DefaultError";

export type DuplicateContext = {
  entity?: string;
  field?: string;
};

export class EntityAlreadyExists extends DefaultError {
  context?: DuplicateContext;

  constructor(context?: DuplicateContext, message?: string) {
    super(
      "EntityAlreadyExists",
      message ?? defaultMessage(context),
    );
    this.context = context;
  }
}

function defaultMessage(context?: DuplicateContext): string {
  if (context?.entity && context?.field) {
    return `${context.entity} with this ${context.field} already exists`;
  }

  if (context?.entity) {
    return `${context.entity} already exists`;
  }

  if (context?.field) {
    return `Entity with this ${context.field} already exists`;
  }

  return "Entity already exists";
}
