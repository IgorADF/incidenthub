import { Organization } from "@domain/entities/organization";
import { CreatedAt } from "@domain/value-objects/created-at";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import type { Prisma } from "@infra/db/generated/client";

export class OrganizationMapper {
	static fromEntityToPrisma(
		entity: Organization,
	): Prisma.OrganizationGetPayload<object> {
		const props = entity.getProps();
		return {
			id: props.id,
			name: props.name,
			createdAt: props.createdAt,
		};
	}

	static fromPrismaToEntity(
		prismaEntity: Prisma.OrganizationGetPayload<object>,
	): Organization {
		return Organization.fromProps({
			id: UUIDv7.parse(prismaEntity.id),
			name: prismaEntity.name,
			createdAt: CreatedAt.parse(prismaEntity.createdAt),
		});
	}
}
