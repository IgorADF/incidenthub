import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";
import { Organization } from "@domain/entities/organization";
import { User } from "@domain/entities/user";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { hashPassword } from "@utils/password";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

type CreateOrganizationUser = {
  email: string;
  password: string;
  type?: "ADMIN" | "DEV";
};

export class CreateOrganization {
  constructor(private readonly uow: UOW) {}

  async execute(orgName: string, userToCreate: CreateOrganizationUser) {
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
      organizationId: new AssociationUUIDv7(organization.getProps().id.value),
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
