import type { UserWithPassword } from "@domain/entities/user";
import type { UsersRepInterface } from "@domain/repositories/interfaces/users";
import type {
	ListUserCursorType,
	ListUserPaginationType,
} from "@domain/use-cases/utils/paginations/list-user-by-organization";
import type { TPrismaClient } from "@infra/db/prisma-client";
import { UserMapper } from "@infra/mappers/user";

export class PrismaUsersRep implements UsersRepInterface {
	constructor(private readonly prisma: TPrismaClient) {}

	async getById(id: string) {
		const record = await this.prisma.user.findUnique({ where: { id } });
		return record ? UserMapper.fromPrismaToEntity(record) : null;
	}

	async hasSameByEmail(email: string) {
		const record = await this.prisma.user.findUnique({
			where: { email },
			select: { email: true },
		});
		return record ? record.email === email : false;
	}

	async getByEmail(email: string) {
		const record = await this.prisma.user.findUnique({ where: { email } });
		return record ? UserMapper.fromPrismaToEntity(record) : null;
	}

	async getByEmailWithPassword(email: string) {
		const record = await this.prisma.user.findUnique({
			where: { email },
			omit: { password: false },
		});

		return record ? UserMapper.fromPrismaToEntityWithPassword(record) : null;
	}

	async listByOrganizationId(
		organizationId: string,
		pagination: ListUserPaginationType,
	) {
		const limit = pagination.limit;
		const normalizedNameCursor = pagination.cursor.normalizedName;
		const idCursur = pagination.cursor.id;
		const hasCursor = !!normalizedNameCursor && !!idCursur;

		const records = await this.prisma.user.findMany({
			where: {
				organizationId,
				...(hasCursor
					? {
							OR: [
								{ normalizedName: { gt: normalizedNameCursor } },
								{ normalizedName: normalizedNameCursor, id: { gt: idCursur } },
							],
						}
					: {}),
			},
			orderBy: [{ normalizedName: "asc" }, { id: "asc" }],
			take: limit + 1,
		});

		const users = records.slice(0, limit).map(UserMapper.fromPrismaToEntity);

		const lastUser = users.at(-1);

		const hasNextPage = records.length > limit;

		const nextCursor: ListUserCursorType =
			hasNextPage && lastUser
				? {
						normalizedName: lastUser.getProps().normalizedName,
						id: lastUser.getProps().id,
					}
				: { normalizedName: null, id: null };

		return {
			users,
			pagination: {
				limit: limit,
				hasNextPage,
				nextCursor,
			},
		};
	}

	async create(data: UserWithPassword) {
		const record = await this.prisma.user.create({
			data: UserMapper.fromEntityWithPasswordToPrisma(data),
		});

		return UserMapper.fromPrismaToEntity(record);
	}

	async updatePassword(id: string, password: string) {
		const record = await this.prisma.user.update({
			where: { id },
			data: { password },
		});
		return UserMapper.fromPrismaToEntity(record);
	}
}
