import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { EmailInterface } from "@domain/services/email.interface";
import type { JwtInterface } from "@domain/services/jwt.interface";
import z from "zod";
import { NotFoundError } from "./errors/NotFoundError";

export const ForgotPasswordInputSchema = z.object({
	email: z.email(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ForgotPasswordOutputSchema = z.object({
	sent: z.boolean(),
});

export type ForgotPasswordOutput = z.infer<typeof ForgotPasswordOutputSchema>;

export class ForgotPassword {
	constructor(
		private readonly uow: UOW,
		private readonly emailService: EmailInterface,
		private readonly jwtService: JwtInterface,
		private readonly uiUrl: string,
	) {}

	async execute(input: ForgotPasswordInput): Promise<ForgotPasswordOutput> {
		const user = await this.uow.repositories.users.getByEmail(input.email);

		if (!user) {
			throw new NotFoundError("user");
		}

		const resetToken = await this.jwtService.signForgotPassword({
			userId: user.getProps().id,
		});

		await this.sendEmail(input.email, resetToken);

		return ForgotPasswordOutputSchema.parse({ sent: true });
	}

	private async sendEmail(userEmail: string, resetToken: string) {
		const link = `${this.uiUrl}/reset-password?token=${resetToken}`;

		await this.emailService.sendEmail({
			to: userEmail,
			subject: "Password reset",
			body: `Reset your password: ${link}`,
		});
	}
}
