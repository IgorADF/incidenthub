import { DefaultEntity } from "./_default";
import { Prisma } from "../db/generated/client";
import { uuidv7 } from "uuidv7";

interface IService {
  id: string;
  projectId: string;
  status: string;
  url: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  expectedResponseStatus: number;
  incidentDetectionFails: number;
  consecutivesIncidentDetectionFails: number;
  emailToAlert: string | null;
  enabled: boolean;
  createdAt: Date;
}

export class Service extends DefaultEntity<IService> {
  static create(
    props: Pick<IService, "projectId" | "url"> &
      Partial<
        Omit<
          IService,
          | "id"
          | "projectId"
          | "url"
          | "status"
          | "consecutivesIncidentDetectionFails"
          | "createdAt"
        >
      >,
  ) {
    return new Service({
      id: uuidv7(),
      projectId: props.projectId,
      status: "unknown",
      url: props.url,
      intervalSeconds: props.intervalSeconds ?? 60,
      timeoutSeconds: props.timeoutSeconds ?? 30,
      expectedResponseStatus: props.expectedResponseStatus ?? 200,
      incidentDetectionFails: props.incidentDetectionFails ?? 1,
      consecutivesIncidentDetectionFails: 0,
      emailToAlert: props.emailToAlert ?? null,
      enabled: props.enabled ?? true,
      createdAt: new Date(),
    });
  }

  static fromEntityToPrisma(
    entity: Service,
  ): Prisma.ServiceGetPayload<object> {
    return {
      id: entity.getProps().id,
      projectId: entity.getProps().projectId,
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
      createdAt: entity.getProps().createdAt,
    };
  }

  static fromPrismaToEntity(
    prismaEntity: Prisma.ServiceGetPayload<object>,
  ): Service {
    return new Service({
      id: prismaEntity.id,
      projectId: prismaEntity.projectId,
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
      createdAt: prismaEntity.createdAt,
    });
  }
}
