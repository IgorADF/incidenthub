import { DefaultEntity } from "./_default-class";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { Email } from "@domain/value-objects/email";
import { Password } from "@domain/value-objects/password";
import { OmitDefaultValues } from "~types/omit-default-values";

const UserSchema = z.object({
  id: UUIDv7,
  organizationId: UUIDv7,
  name: z.string().min(1).max(50),
  email: Email,
  password: Password,
  type: z.enum(["ADMIN", "DEV"]),
  createdAt: CreatedAt,
});

type UserType = z.infer<typeof UserSchema>;

export type CreateUserType = OmitDefaultValues<UserType>;

export class User extends DefaultEntity<UserType> {
  static create(props: CreateUserType) {
    return User.fromProps({
      ...props,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: UserType) {
    return new User(props, UserSchema);
  }
}
