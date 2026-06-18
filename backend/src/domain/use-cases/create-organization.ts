import { Organization } from "@domain/entities/organization";
import { User } from "@domain/entities/user";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { hashPassword } from "@utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

type CreateOrganizationType = {
  name: string;
};

type CreateOrganizationUserType = {
  email: string;
  name: string;
  password: string;
  type?: "ADMIN" | "DEV";
};

export class CreateOrganization {
  constructor(private readonly uow: UOW) {}

  async execute(
    { name: orgName }: CreateOrganizationType,
    userToCreate: CreateOrganizationUserType,
  ) {
    const orgWithSameName =
      await this.uow.repositories.organizations.getByName(orgName);

    if (orgWithSameName) {
      throw new EntityAlreadyExists({
        entity: "organization",
        field: "name",
      });
    }

    const userWithSameEmail = await this.uow.repositories.users.getByEmail(
      userToCreate.email,
    );

    if (userWithSameEmail) {
      throw new EntityAlreadyExists({
        entity: "user",
        field: "email",
      });
    }

    const organization = Organization.create({ name: orgName });
    const user = User.create({
      organizationId: organization.getProps().id,
      name: userToCreate.name,
      email: userToCreate.email,
      password: await hashPassword(userToCreate.password),
      type: userToCreate.type ?? "ADMIN",
    });

    return await this.uow.transaction(async (reps) => {
      await reps.organizations.create(organization);
      await reps.users.create(user);
      return { organization, user };
    });
  }
}
