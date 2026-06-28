import { CreatedAt } from "@domain/value-objects/created-at";
import { Email } from "@domain/value-objects/email";
import { Password } from "@domain/value-objects/password";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import z from "zod";
import type { OmitDefaultValues } from "~types/omit-default-values";
import { DefaultEntity } from "./_default";

export const UserSchema = z.object({
	id: UUIDv7,
	organizationId: UUIDv7,
	name: z.string().min(3).max(50),
	email: Email,
	type: z.enum(["ADMIN", "DEV"]),
	createdAt: CreatedAt,
});

export const UserWithPasswordSchema = UserSchema.extend({
	password: Password,
});

export type UserType = z.infer<typeof UserSchema>;
export type UserWithPasswordType = z.infer<typeof UserWithPasswordSchema>;

export type CreateUserType = OmitDefaultValues<UserType>;
export type CreateUserWithPasswordType =
	OmitDefaultValues<UserWithPasswordType>;

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

export class UserWithPassword extends DefaultEntity<UserWithPasswordType> {
	static create(props: CreateUserWithPasswordType) {
		return UserWithPassword.fromProps({
			...props,
			...DefaultEntity.generateEntityDefaultValues(),
		});
	}

	static fromProps(props: UserWithPasswordType) {
		return new UserWithPassword(props, UserWithPasswordSchema);
	}
}
