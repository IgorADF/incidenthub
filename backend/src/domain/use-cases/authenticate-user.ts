import { UOW } from "@domain/repositories/interfaces/_uow";
import { InvalidCredentialError } from "./errors/InvalidCredentialError";
import { HashPasswordInterface } from "@domain/services/hash-password.interface";

type AuthenticateUserInput = {
  email: string;
  password: string;
};

export class AuthenticateUser {
  constructor(
    private readonly uow: UOW,
    private readonly hashPasswordService: HashPasswordInterface,
  ) {}

  async execute(input: AuthenticateUserInput) {
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

    return { user };
  }
}
