import { UserSchema } from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { HashPasswordInterface } from "@domain/services/hash-password.interface";
import z from "zod";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

export const AuthenticateUserInputSchema = z.object({
	email: z.string(),
	password: z.string(),
});

export type AuthenticateUserInput = z.infer<typeof AuthenticateUserInputSchema>;

export const AuthenticateUserOutputSchema = z.object({
	user: UserSchema,
});

export type AuthenticateUserOutput = z.infer<
	typeof AuthenticateUserOutputSchema
>;

export class AuthenticateUser {
	constructor(
		private readonly uow: UOW,
		private readonly hashPasswordService: HashPasswordInterface,
	) {}

	async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
		const user = await this.uow.repositories.users.getByEmailWithPassword(
			input.email,
		);

		if (!user) {
			throw new InvalidCredentialError();
		}

		const isPasswordValid = await this.hashPasswordService.compare(
			input.password,
			user.getProps().password,
		);

		if (!isPasswordValid) {
			throw new InvalidCredentialError();
		}

		return AuthenticateUserOutputSchema.parse({ user: user.getProps() });
	}
}
