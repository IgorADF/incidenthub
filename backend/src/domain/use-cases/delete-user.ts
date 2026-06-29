import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import { NotFoundError } from "./errors/NotFoundError";

export const DeleteUserOutputSchema = z.object({
	deleted: z.boolean(),
});

export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;

export class DeleteUser {
	constructor(private readonly uow: UOW) {}

	async execute(
		actorUserId: string,
		targetUserId: string,
	): Promise<DeleteUserOutput> {
		const actor = await this.uow.repositories.users.getById(actorUserId);

		if (actor?.getProps()?.type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const target = await this.uow.repositories.users.getById(targetUserId);

		if (!target) {
			throw new NotFoundError("User");
		}

		const actorOrgId = actor.getProps().organizationId;
		const targetOrgId = target.getProps().organizationId;

		if (actorOrgId !== targetOrgId) {
			throw new NotAllowedError();
		}

		if (actorUserId === targetUserId) {
			throw new NotAllowedError("You cannot delete your own account");
		}

		if (target.getProps().type === "ADMIN") {
			const adminCount =
				await this.uow.repositories.users.countByOrganizationIdAndType(
					actorOrgId,
					"ADMIN",
				);

			if (adminCount <= 1) {
				throw new NotAllowedError(
					"Cannot delete the last admin of the organization",
				);
			}
		}

		return await this.uow.transaction(async (reps) => {
			await reps.users.delete(targetUserId);
			return DeleteUserOutputSchema.parse({ deleted: true });
		});
	}
}
