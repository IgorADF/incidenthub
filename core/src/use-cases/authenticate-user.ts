import { UOW } from "../repositories/interfaces/_uow";
import { comparePassword } from "../utils/password";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

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
