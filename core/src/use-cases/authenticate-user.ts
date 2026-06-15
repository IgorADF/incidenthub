import { UOW } from "../repositories/interfaces/_uow";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";

type AuthenticateUserInput = {
  email: string;
  password: string;
};

export class Authenticateuser {
  constructor(private readonly uow: UOW) {}

  async execute(input: AuthenticateUserInput) {
    const user = await this.uow.repositories.users.getByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialError();
    }

    if (user.getProps().password !== input.password) {
      throw new InvalidCredentialError();
    }

    return { user };
  }
}
