import z from "zod";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { HashPasswordInterface } from "@domain/services/hash-password.interface";
import { UserSchema } from "@domain/entities/user";

export const AuthenticateUserInputSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type AuthenticateUserInput = z.infer<typeof AuthenticateUserInputSchema>;

export const AuthenticateUserOutputSchema = z.object({
  user: UserSchema.omit({ password: true }),
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
    const user = await this.uow.repositories.users.getByEmail(input.email);

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
