import z from "zod";
import { ValidationError } from "@domain/entities/errors/ValidationError";
import { uuidv7 } from "uuidv7";

export class DefaultEntity<T> {
  private readonly props: T;

  constructor(props: T, schema: z.ZodType<T>) {
    const { success, data, error } = schema.safeParse(props);

    if (!success) {
      throw new ValidationError(JSON.stringify(z.treeifyError(error)));
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
