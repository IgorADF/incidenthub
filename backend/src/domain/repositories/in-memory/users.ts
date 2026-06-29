import { User, UserWithPassword } from "@domain/entities/user";
import type { UsersRepInterface } from "@domain/repositories/interfaces/users";
import type { ListUserPaginationType } from "@domain/use-cases/utils/paginations/list-user-by-organization";
import type { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
	constructor(private readonly db: IMUOWdb) {}

	private toUserClass(data: UserWithPassword) {
		const { password: _password, ...props } = data.getProps();
		return User.fromProps(props);
	}

	async getById(id: string) {
		const record = this.db.users.find((u) => u.getProps().id === id);
		return record ? this.toUserClass(record) : null;
	}

	async hasSameByEmail(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return false;
		}

		return record.getProps().email === email;
	}

	async getByEmail(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return null;
		}

		return this.toUserClass(record);
	}

	async getByEmailWithPassword(email: string) {
		const record = this.db.users.find((u) => u.getProps().email === email);

		if (!record) {
			return null;
		}

		return record ?? null;
	}

	async listByOrganizationId(
		organizationId: string,
		pagination: ListUserPaginationType,
	) {
		const limit = pagination.limit;
		const cursor = pagination.cursor;

		const sortedUsers = this.db.users
			.filter((u) => u.getProps().organizationId === organizationId)
			.map((u) => this.toUserClass(u))
			.sort((a, b) => {
				const nameComparison = a
					.getProps()
					.normalizedName.localeCompare(b.getProps().normalizedName);

				if (nameComparison !== 0) {
					return nameComparison;
				}

				return a.getProps().id.localeCompare(b.getProps().id);
			});

		const hashCursorProps = !!cursor.normalizedName && !!cursor.id;

		const afterCursor = hashCursorProps
			? sortedUsers.filter((u) => {
					const props = u.getProps();

					return (
						props.normalizedName > cursor.normalizedName! ||
						(props.normalizedName === cursor.normalizedName &&
							props.id > cursor.id!)
					);
				})
			: sortedUsers;

		const users = afterCursor.slice(0, limit);
		const hasNextPage = afterCursor.length > limit;
		const lastUser = users.at(-1);

		return {
			users,
			pagination: {
				limit: limit,
				hasNextPage,
				nextCursor:
					hasNextPage && lastUser
						? {
								normalizedName: lastUser.getProps().normalizedName,
								id: lastUser.getProps().id,
							}
						: { normalizedName: null, id: null },
			},
		};
	}

	async create(data: UserWithPassword) {
		this.db.users.push(data);
		return this.toUserClass(data);
	}

	async update(data: User) {
		const index = this.db.users.findIndex(
			(u) => u.getProps().id === data.getProps().id,
		);
		if (index === -1) {
			return null;
		}
		const updated = UserWithPassword.fromProps({
			...this.db.users[index]!.getProps(),
			...data.getProps(),
		});
		this.db.users[index] = updated;
		return this.toUserClass(updated);
	}

	async updatePassword(id: string, password: string) {
		const index = this.db.users.findIndex((u) => u.getProps().id === id);
		if (index === -1) {
			return null;
		}

		const { password: _password, ...props } = this.db.users[index]!.getProps();
		const updated = UserWithPassword.fromProps({ ...props, password });
		this.db.users[index] = updated;
		return this.toUserClass(updated);
	}

	async countByOrganizationIdAndType(
		organizationId: string,
		type: "ADMIN" | "DEV",
	) {
		return this.db.users.filter(
			(u) =>
				u.getProps().organizationId === organizationId &&
				u.getProps().type === type,
		).length;
	}

	async delete(id: string) {
		const index = this.db.users.findIndex((u) => u.getProps().id === id);
		if (index !== -1) {
			this.db.users.splice(index, 1);
		}
	}
}
