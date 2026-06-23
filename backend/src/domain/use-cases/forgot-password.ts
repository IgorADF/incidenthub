import z from "zod";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { EmailInterface } from "@domain/services/email.interface";
import { JwtInterface } from "@domain/services/jwt.interface";

export const ForgotPasswordInputSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export class ForgotPassword {
  constructor(
    private readonly uow: UOW,
    private readonly emailService: EmailInterface,
    private readonly jwtService: JwtInterface,
    private readonly uiUrl: string,
  ) {}

  async execute(input: ForgotPasswordInput) {
    const user = await this.uow.repositories.users.getByEmail(input.email);
    if (!user) {
      return { sent: true };
    }

    const resetToken = await this.jwtService.signForgotPassword({
      sub: user.getProps().id,
    });

    await this.sendEmail(input.email, resetToken);

    return { sent: true };
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
