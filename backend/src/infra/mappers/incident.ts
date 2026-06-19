import { Incident } from "@domain/entities/incident";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class IncidentMapper {
  static fromEntityToPrisma(
    entity: Incident,
  ): Prisma.IncidentGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      serviceId: props.serviceId,
      startedAt: props.startedAt,
      resolvedAt: props.resolvedAt,
      emailsSent: props.emailsSent,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.IncidentGetPayload<object>,
  ): Incident {
    return Incident.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      serviceId: UUIDv7.parse(prismaEntity.serviceId),
      startedAt: CreatedAt.parse(prismaEntity.startedAt),
      resolvedAt: prismaEntity.resolvedAt
        ? CreatedAt.parse(prismaEntity.resolvedAt)
        : null,
      emailsSent: prismaEntity.emailsSent,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
