import z from "zod";
import { ValidationError } from "@domain/entities/errors/ValidationError";
import { uuidv7 } from "uuidv7";

export class DefaultEntity<T> {
  private readonly props: T;

  constructor(props: T, schema: z.ZodType<T>) {
    const { success, data, error } = schema.safeParse(props);

    if (!success) {
      const issues = error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
        message: issue.message,
      }));
      throw new ValidationError(issues);
    }
    this.props = Object.freeze(data as T);
  }

  getProps(): Readonly<T> {
    return this.props;
  }

  static generateUUIDv7() {
    return uuidv7();
  }

  static generateNowDate() {
    return new Date();
  }

  static generateEntityDefaultValues() {
    return {
      id: DefaultEntity.generateUUIDv7(),
      createdAt: DefaultEntity.generateNowDate(),
    };
  }
}
