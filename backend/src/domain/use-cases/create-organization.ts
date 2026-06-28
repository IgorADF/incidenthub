import {
	Organization,
	OrganizationSchema,
} from "@domain/entities/organization";
import {
	UserSchema,
	UserWithPassword,
	UserWithPasswordSchema,
} from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { HashPasswordInterface } from "@domain/services/hash-password.interface";
import z from "zod";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

export const CreateOrganizationInputSchema = z.object({
	organization: z.object({
		name: OrganizationSchema.shape.name,
	}),
	user: z.object({
		name: UserSchema.shape.name,
		email: UserSchema.shape.email,
		password: UserWithPasswordSchema.shape.password,
	}),
});

export type CreateOrganizationInput = z.infer<
	typeof CreateOrganizationInputSchema
>;

export const CreateOrganizationOutputSchema = z.object({
	organization: OrganizationSchema,
	user: UserSchema,
});

export type CreateOrganizationOutput = z.infer<
	typeof CreateOrganizationOutputSchema
>;

export class CreateOrganization {
	constructor(
		private readonly uow: UOW,
		private readonly hashPasswordService: HashPasswordInterface,
	) {}

	async execute(
		input: CreateOrganizationInput,
	): Promise<CreateOrganizationOutput> {
		const orgWithSameName = await this.uow.repositories.organizations.getByName(
			input.organization.name,
		);

		if (orgWithSameName) {
			throw new EntityAlreadyExists({
				entity: "organization",
				field: "name",
			});
		}

		const userWithSameEmail = await this.uow.repositories.users.hasSameByEmail(
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

		const user = UserWithPassword.create({
			organizationId: organization.getProps().id,
			name: input.user.name,
			email: input.user.email,
			password: await this.hashPasswordService.hashPassword(
				input.user.password,
			),
			type: "ADMIN",
		});

		return await this.uow.transaction(async (reps) => {
			const createdOrganization = await reps.organizations.create(organization);

			const createdUser = await reps.users.create(user);

			return CreateOrganizationOutputSchema.parse({
				organization: createdOrganization.getProps(),
				user: createdUser.getProps(),
			});
		});
	}
}
