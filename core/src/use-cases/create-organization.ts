import { UOW } from "../repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

type CreateOrganizationUser = {
  email: string;
  password: string;
  type?: "ADMIN" | "DEV";
};

export class Createorganization {
  constructor(private readonly uow: UOW) {}

  async execute(orgName: string, user: CreateOrganizationUser) {
    return await this.uow.transaction(async (reps) => {
      const orgWithSameName = await reps.organizations.getByName(orgName);

      if (orgWithSameName) {
        throw new EntityAlreadyExists({
          entity: "organization",
          field: "name",
        });
      }

      const userWithSameEmail = await reps.users.getByEmail(user.email);

      if (userWithSameEmail) {
        throw new EntityAlreadyExists({
          entity: "user",
          field: "email",
        });
      }

      const organization = await reps.organizations.create({
        name: orgName,
      });

      const firstUser = await reps.users.create({
        organizationId: organization.id,
        email: user.email,
        password: user.password,
        type: user.type ?? "ADMIN",
      });

      return { organization, user: firstUser };
    });
  }
}
