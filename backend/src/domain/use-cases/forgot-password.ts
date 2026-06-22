import { UOW } from "@domain/repositories/interfaces/_uow";
import { Email } from "@domain/value-objects/email";
import { EmailInterface } from "@domain/services/email.interface";
import { JwtInterface } from "@domain/services/jwt.interface";
import { NotFoundError } from "./errors/NotFoundError";
import { ValidationUseCasesError } from "./errors/ValidationUseCasesError";

type ForgotPasswordInput = {
  email: string;
};

export class ForgotPassword {
  constructor(
    private readonly uow: UOW,
    private readonly emailService: EmailInterface,
    private readonly jwtService: JwtInterface,
    private readonly uiUrl: string,
  ) {}

  async execute(input: ForgotPasswordInput) {
    const { data: email, success: successEmailValidation } = Email.safeParse(
      input.email,
    );
    if (!successEmailValidation) {
      throw new ValidationUseCasesError("Invalid email");
    }

    const user = await this.uow.repositories.users.getByEmail(email);
    if (!user) {
      throw new NotFoundError("user");
    }

    const resetToken = await this.jwtService.signForgotPassword({
      sub: user.getProps().id,
    });

    this.sendEmail(email, resetToken);

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
