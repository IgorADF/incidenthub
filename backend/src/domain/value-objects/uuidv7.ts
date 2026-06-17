import { uuidv7 } from "uuidv7";
import z from "zod";
import { ValueObjectError } from "./_error";

const ValidationSchema = z.object({
  _value: z.uuidv7(),
});

export class UUIDv7 {
  readonly value: string;
  constructor(value?: string) {
    if (value) {
      const { success } = ValidationSchema.safeParse({ _value: value });

      if (!success) {
        throw new ValueObjectError(
          "UUIDv7",
          "validation",
          "Invalid uuidv7 format",
        );
      }

      this.value = value;
    } else {
      this.value = uuidv7();
    }
  }
}
