import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { HashPasswordInterface } from "@domain/services/hash-password.interface";
import type { JwtInterface } from "@domain/services/jwt.interface";
import { Password } from "@domain/value-objects/password";
import z from "zod";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { NotFoundError } from "./errors/NotFoundError";

export const ResetPasswordInputSchema = z.object({
	token: z.string().min(1),
	password: Password,
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const ResetPasswordOutputSchema = z.object({
	reset: z.boolean(),
});

export type ResetPasswordOutput = z.infer<typeof ResetPasswordOutputSchema>;

export class ResetPassword {
	constructor(
		private readonly uow: UOW,
		private readonly jwtService: JwtInterface,
		private readonly hashPasswordService: HashPasswordInterface,
	) {}

	async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
		const userId = await this.verifyResetToken(input.token);

		await this.uow.transaction(async (reps) => {
			const user = await this.uow.repositories.users.getById(userId);
			if (!user) {
				throw new NotFoundError("user");
			}

			const hashedPassword = await this.hashPasswordService.hashPassword(
				input.password,
			);

			return reps.users.updatePassword(userId, hashedPassword);
		});

		return ResetPasswordOutputSchema.parse({ reset: true });
	}

	private async verifyResetToken(token: string): Promise<string> {
		try {
			const payload = await this.jwtService.verifyForgotPassword(token);
			return payload.userId;
		} catch {
			throw new InvalidCredentialError("Invalid or expired reset token");
		}
	}
}
