import { HealthCheck } from "@domain/entities/health-check";
import { Prisma } from "@infra/db/generated/client";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";

export class HealthCheckMapper {
  static fromEntityToPrisma(
    entity: HealthCheck,
  ): Prisma.HealthCheckGetPayload<object> {
    const props = entity.getProps();
    return {
      id: props.id,
      serviceId: props.serviceId,
      url: props.url,
      requestTime: props.requestTime,
      isError: props.isError,
      timedOut: props.timedOut,
      responseStatus: props.responseStatus,
      responseJsonData: props.responseJsonData,
      createdAt: props.createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.HealthCheckGetPayload<object>,
  ): HealthCheck {
    return HealthCheck.fromProps({
      id: UUIDv7.parse(prismaEntity.id),
      serviceId: UUIDv7.parse(prismaEntity.serviceId),
      url: prismaEntity.url,
      requestTime: prismaEntity.requestTime,
      isError: prismaEntity.isError,
      timedOut: prismaEntity.timedOut,
      responseStatus: prismaEntity.responseStatus,
      responseJsonData: prismaEntity.responseJsonData,
      createdAt: CreatedAt.parse(prismaEntity.createdAt),
    });
  }
}
