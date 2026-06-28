import {
	UserSchema,
	UserWithPassword,
	UserWithPasswordSchema,
} from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import type { HashPasswordInterface } from "@domain/services/hash-password.interface";
import z from "zod";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";

export const CreateUserToOrganizationInputSchema = z.object({
	email: UserSchema.shape.email,
	password: UserWithPasswordSchema.shape.password,
	name: UserSchema.shape.name,
	type: UserSchema.shape.type,
});

export type CreateUserToOrganizationInput = z.infer<
	typeof CreateUserToOrganizationInputSchema
>;

export const CreateUserToOrganizationOutputSchema = z.object({
	user: UserSchema,
});

export type CreateUserToOrganizationOutput = z.infer<
	typeof CreateUserToOrganizationOutputSchema
>;

export class CreateUserToOrganization {
	constructor(
		private readonly uow: UOW,
		private readonly hashPasswordService: HashPasswordInterface,
	) { }

	async execute(
		creatorUserId: string,
		newUserData: CreateUserToOrganizationInput,
	): Promise<CreateUserToOrganizationOutput> {
		const creator = await this.uow.repositories.users.getById(creatorUserId);

		if (!creator || creator.getProps().type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const userWithSameEmail = await this.uow.repositories.users.hasSameByEmail(
			newUserData.email,
		);

		if (userWithSameEmail) {
			throw new EntityAlreadyExists({
				entity: "user",
				field: "email",
			});
		}

		const user = UserWithPassword.create({
			organizationId: creator.getProps().organizationId,
			email: newUserData.email,
			password: await this.hashPasswordService.hashPassword(
				newUserData.password,
			),
			type: newUserData.type,
			name: newUserData.name,
		});

		return await this.uow.transaction(async (reps) => {
			const created = await reps.users.create(user);

			return CreateUserToOrganizationOutputSchema.parse({
				user: created.getProps(),
			});
		});
	}
}
