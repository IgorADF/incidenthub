import { User } from "@domain/entities/user";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { hashPassword } from "@utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

type CreateUserToOrganizationInput = {
  email: string;
  password: string;
  type?: "ADMIN" | "DEV";
};

export class CreateUserToOrganization {
  constructor(private readonly uow: UOW) {}

  async execute(
    creatorUserId: string,
    newUserData: CreateUserToOrganizationInput,
  ) {
    const creator = await this.uow.repositories.users.getById(creatorUserId);

    if (!creator || creator.getProps().type !== "ADMIN") {
      throw new NotAllowedError();
    }

    const userWithSameEmail = await this.uow.repositories.users.getByEmail(
      newUserData.email,
    );

    if (userWithSameEmail) {
      throw new EntityAlreadyExists({
        entity: "user",
        field: "email",
      });
    }

    const user = User.create({
      organizationId: creator.getProps().organizationId,
      email: newUserData.email,
      password: await hashPassword(newUserData.password),
      type: newUserData.type ?? "DEV",
    });

    return await this.uow.transaction(async (reps) => {
      await reps.users.create(user);
      return { user };
    });
  }
}
