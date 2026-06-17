import { Service } from "@domain/entities/service";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class ServiceMapper {
  static fromEntityToPrisma(entity: Service): Prisma.ServiceGetPayload<object> {
    return {
      id: entity.getProps().id.value,
      projectId: entity.getProps().projectId.value,
      status: entity.getProps().status,
      url: entity.getProps().url,
      intervalSeconds: entity.getProps().intervalSeconds,
      timeoutSeconds: entity.getProps().timeoutSeconds,
      expectedResponseStatus: entity.getProps().expectedResponseStatus,
      incidentDetectionFails: entity.getProps().incidentDetectionFails,
      consecutivesIncidentDetectionFails:
        entity.getProps().consecutivesIncidentDetectionFails,
      emailToAlert: entity.getProps().emailToAlert,
      enabled: entity.getProps().enabled,
      createdAt: entity.getProps().createdAt.value,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ServiceGetPayload<object>,
  ): Service {
    return new Service({
      id: new UUIDv7(prismaEntity.id),
      projectId: new AssociationUUIDv7(prismaEntity.projectId),
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
      createdAt: new CreatedAt(prismaEntity.createdAt),
    });
  }
}
