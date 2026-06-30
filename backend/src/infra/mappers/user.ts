import { User, type UserType, UserWithPassword } from "@domain/entities/user";
import { CreatedAt } from "@domain/value-objects/created-at";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import type { Prisma } from "@infra/db/generated/client";

export class UserMapper {
	static fromEntityWithPasswordToPrisma(
		entity: UserWithPassword,
	): Prisma.UserGetPayload<object> {
		const props = entity.getProps();
		return {
			id: props.id,
			name: props.name,
			normalizedName: props.normalizedName,
			organizationId: props.organizationId,
			email: props.email,
			password: props.password,
			type: props.type,
			createdAt: props.createdAt,
		};
	}

	static getPrismaToEntityProps(
		prismaEntity:
			| Prisma.UserGetPayload<object>
			| Prisma.UserGetPayload<{ omit: { password: true } }>,
	): UserType {
		return {
			id: UUIDv7.parse(prismaEntity.id),
			organizationId: UUIDv7.parse(prismaEntity.organizationId),
			name: prismaEntity.name,
			normalizedName: prismaEntity.normalizedName,
			email: prismaEntity.email,
			type: prismaEntity.type,
			createdAt: CreatedAt.parse(prismaEntity.createdAt),
		};
	}

	static fromPrismaToEntity(
		prismaEntity: Prisma.UserGetPayload<{ omit: { password: true } }>,
	): User {
		const props = UserMapper.getPrismaToEntityProps(prismaEntity);
		return User.fromProps(props);
	}

	static fromPrismaToEntityWithPassword(
		prismaEntity: Prisma.UserGetPayload<object>,
	): UserWithPassword {
		const props = UserMapper.getPrismaToEntityProps(prismaEntity);
		return UserWithPassword.fromProps({
			...props,
			password: prismaEntity.password,
		});
	}
}
