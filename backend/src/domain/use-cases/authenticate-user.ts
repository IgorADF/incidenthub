import { comparePassword } from "@utils/password";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { tryCatch } from "bullmq";

type AuthenticateUserInput = {
  email: string;
  password: string;
};

export class AuthenticateUser {
  constructor(private readonly uow: UOW) {}

  async execute(input: AuthenticateUserInput) {
    const user = await this.uow.repositories.users.getByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialError();
    }

    const isPasswordValid = await comparePassword(
      input.password,
      user.getProps().password,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialError();
    }

    return { user };
  }
}
