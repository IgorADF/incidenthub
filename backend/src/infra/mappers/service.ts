import { Service } from "@domain/entities/service";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

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
      status: prismaEntity.status,
      url: prismaEntity.url,
      intervalSeconds: prismaEntity.intervalSeconds,
      timeoutSeconds: prismaEntity.timeoutSeconds,
      expectedResponseStatus: prismaEntity.expectedResponseStatus,
      incidentDetectionFails: prismaEntity.incidentDetectionFails,
      consecutivesIncidentDetectionFails:
        prismaEntity.consecutivesIncidentDetectionFails,
      emailToAlert: prismaEntity.emailToAlert,
      enabled: prismaEntity.enabled,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
