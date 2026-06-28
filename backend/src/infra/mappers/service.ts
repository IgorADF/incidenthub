import { Service } from "@domain/entities/service";
import { CreatedAt } from "@domain/value-objects/created-at";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import type { Prisma } from "@infra/db/generated/client";

export class ServiceMapper {
	static fromEntityToPrisma(entity: Service): Prisma.ServiceGetPayload<object> {
		const props = entity.getProps();
		return {
			id: props.id,
			projectId: props.projectId,
			name: props.name,
			status: props.status,
			url: props.url,
			intervalSeconds: props.intervalSeconds,
			timeoutSeconds: props.timeoutSeconds,
			expectedResponseStatus: props.expectedResponseStatus,
			incidentDetectionFails: props.incidentDetectionFails,
			consecutivesIncidentDetectionFails:
				props.consecutivesIncidentDetectionFails,
			emailToAlert: props.emailToAlert,
			enabled: props.enabled,
			currentIncidentId: props.currentIncidentId,
			lastCheckedAt: props.lastCheckedAt,
			createdAt: props.createdAt,
		};
	}

	static fromPrismaToEntity(
		prismaEntity: Prisma.ServiceGetPayload<object>,
	): Service {
		return Service.fromProps({
			id: UUIDv7.parse(prismaEntity.id),
			projectId: UUIDv7.parse(prismaEntity.projectId),
			name: prismaEntity.name,
			status: prismaEntity.status as "CHECKING" | "INCIDENT" | "DISABLED",
			url: prismaEntity.url,
			intervalSeconds: prismaEntity.intervalSeconds,
			timeoutSeconds: prismaEntity.timeoutSeconds,
			expectedResponseStatus: prismaEntity.expectedResponseStatus,
			incidentDetectionFails: prismaEntity.incidentDetectionFails,
			consecutivesIncidentDetectionFails:
				prismaEntity.consecutivesIncidentDetectionFails,
			emailToAlert: prismaEntity.emailToAlert,
			enabled: prismaEntity.enabled,
			currentIncidentId: prismaEntity.currentIncidentId
				? UUIDv7.parse(prismaEntity.currentIncidentId)
				: null,
			lastCheckedAt: prismaEntity.lastCheckedAt
				? CreatedAt.parse(prismaEntity.lastCheckedAt)
				: null,
			createdAt: CreatedAt.parse(prismaEntity.createdAt),
		});
	}
}
