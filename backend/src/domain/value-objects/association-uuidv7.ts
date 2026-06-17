import z from "zod";
import { ValueObjectError } from "./_error";

const ValidationSchema = z.object({
  _value: z.uuidv7(),
});

export class AssociationUUIDv7 {
  readonly value: string;
  constructor(value: string) {
    const { success } = ValidationSchema.safeParse({ _value: value });

    if (!success) {
      throw new ValueObjectError(
        "AssociationUUIDv7",
        "validation",
        "Invalid uuidv7 format",
      );
    }

    this.value = value;
  }
}
