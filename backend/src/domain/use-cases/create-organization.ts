import { Organization } from "@domain/entities/organization";
import { User } from "@domain/entities/user";
import { UOW } from "@domain/repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { HashPasswordInterface } from "@domain/services/hash-password.interface";
import z from "zod";

export const CreateOrganizationInputSchema = z.object({
  organization: z.object({
    name: z.string(),
  }),
  user: z.object({
    email: z.string(),
    name: z.string(),
    password: z.string(),
  }),
});

export type CreateOrganizationInput = z.infer<
  typeof CreateOrganizationInputSchema
>;

export class CreateOrganization {
  constructor(
    private readonly uow: UOW,
    private readonly hashPasswordService: HashPasswordInterface,
  ) {}

  async execute(input: CreateOrganizationInput) {
    const orgWithSameName = await this.uow.repositories.organizations.getByName(
      input.organization.name,
    );

    if (orgWithSameName) {
      throw new EntityAlreadyExists({
        entity: "organization",
        field: "name",
      });
    }

    const userWithSameEmail = await this.uow.repositories.users.getByEmail(
      input.user.email,
    );

    if (userWithSameEmail) {
      throw new EntityAlreadyExists({
        entity: "user",
        field: "email",
      });
    }

    const organization = Organization.create({
      name: input.organization.name,
    });
    const user = User.create({
      organizationId: organization.getProps().id,
      name: input.user.name,
      email: input.user.email,
      password: await this.hashPasswordService.hashPassword(
        input.user.password,
      ),
      type: "ADMIN",
    });

    return await this.uow.transaction(async (reps) => {
      await reps.organizations.create(organization);
      await reps.users.create(user);
      return { organization, user };
    });
  }
}
