import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { Email } from "@domain/value-objects/email";
import { Password } from "@domain/value-objects/password";
import { OmitDefaultValues } from "~types/omit-default-values";

export const UserSchema = z.object({
  id: UUIDv7,
  organizationId: UUIDv7,
  password: Password,
  name: z.string().min(3).max(50),
  email: Email,
  type: z.enum(["ADMIN", "DEV"]),
  createdAt: CreatedAt,
});

// export const UserWithPasswordSchema = UserSchema.extend({
//   password: Password,
// });

type UserType = z.infer<typeof UserSchema>;
// type UserWithPasswordType = z.infer<typeof UserWithPasswordSchema>;

export type CreateUserType = OmitDefaultValues<UserType>;
// export type CreateUserWithPasswordType = OmitDefaultValues<UserWithPasswordType>;

export class User extends DefaultEntity<UserType> {
  static create(props: CreateUserType) {
    return User.fromProps({
      ...props,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  // static createWithPassword(props: CreateUserWithPasswordType) {
  //   return User.fromWithPasswordProps({
  //     ...props,
  //     ...DefaultEntity.generateEntityDefaultValues(),
  //   });
  // }

  static fromProps(props: UserType) {
    return new User(props, UserSchema);
  }

  // static fromWithPasswordProps(props: UserWithPasswordType) {
  //   return new User(props, UserWithPasswordSchema);
  // }
}
