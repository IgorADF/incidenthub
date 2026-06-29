import { User, UserSchema } from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const UpdateUserInputSchema = z
	.object({
		name: UserSchema.shape.name.optional(),
		email: UserSchema.shape.email.optional(),
		type: UserSchema.shape.type.optional(),
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.email !== undefined ||
			data.type !== undefined,
		{ message: "At least one field must be provided" },
	);

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const UpdateUserOutputSchema = z.object({
	user: UserSchema,
});

export type UpdateUserOutput = z.infer<typeof UpdateUserOutputSchema>;

export class UpdateUser {
	constructor(private readonly uow: UOW) { }

	async execute(
		actorUserId: string,
		targetUserId: string,
		input: UpdateUserInput,
	): Promise<UpdateUserOutput> {
		const actor = await this.uow.repositories.users.getById(actorUserId);

		if (actor?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const target = await this.uow.repositories.users.getById(targetUserId);

		if (!target) {
			throw new NotFoundError("User");
		}

		if (target.getProps().organizationId !== actor.getProps().organizationId) {
			throw new NotAllowedError();
		}

		const targetProps = target.getProps();
		const newEmail = input.email ?? targetProps.email;
		const newName = input.name ?? targetProps.name;
		const newType = input.type ?? targetProps.type;

		if (input.email !== undefined && input.email !== targetProps.email) {
			const existing = await this.uow.repositories.users.getByEmail(newEmail);

			if (existing && existing.getProps().id !== targetUserId) {
				throw new EntityAlreadyExists({ entity: "user", field: "email" });
			}
		}

		if (
			targetProps.type === "ADMIN" &&
			newType === "DEV" &&
			targetProps.organizationId === actor.getProps().organizationId
		) {
			const adminCount =
				await this.uow.repositories.users.countByOrganizationIdAndType(
					targetProps.organizationId,
					"ADMIN",
				);

			if (adminCount <= 1) {
				throw new NotAllowedError(
					"Cannot demote the last admin of the organization",
				);
			}
		}

		const userToUpdate = User.fromProps({
			...targetProps,
			name: newName,
			normalizedName: newName,
			email: newEmail,
			type: newType,
		});

		const updatedUser = await this.uow.transaction(async (reps) => {
			const result = await reps.users.update(userToUpdate);

			if (!result) {
				throw new NotFoundError("User");
			}

			return result
		});

		return UpdateUserOutputSchema.parse({ user: updatedUser.getProps() });
	}
}
