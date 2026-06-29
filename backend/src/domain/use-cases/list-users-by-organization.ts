import { UserSchema } from "@domain/entities/user";
import type { UOW } from "@domain/repositories/interfaces/_uow";
import z from "zod";
import { NotAllowedError } from "./errors/NotAllowedError";
import {
	type ListUserPaginationType,
	NextPaginationListUser,
} from "./utils/paginations/list-user-by-organization";

export const ListUsersByOrganizationOutputSchema = z.object({
	users: z.array(UserSchema),
	pagination: NextPaginationListUser,
});

export type ListUsersByOrganizationOutput = z.infer<
	typeof ListUsersByOrganizationOutputSchema
>;

export class ListUsersByOrganization {
	constructor(private readonly uow: UOW) {}

	async execute(
		requesterUserId: string,
		pagination: ListUserPaginationType,
	): Promise<ListUsersByOrganizationOutput> {
		const requester =
			await this.uow.repositories.users.getById(requesterUserId);

		if (!requester || requester.getProps().type !== "ADMIN") {
			throw new NotAllowedError();
		}

		const { users, pagination: nextPagination } =
			await this.uow.repositories.users.listByOrganizationId(
				requester.getProps().organizationId,
				pagination,
			);

		return ListUsersByOrganizationOutputSchema.parse({
			users: users.map((user) => user.getProps()),
			pagination: nextPagination,
		});
	}
}
