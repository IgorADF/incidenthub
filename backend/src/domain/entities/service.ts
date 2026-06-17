import { DefaultEntity } from "./_default";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";

interface IService {
  id: UUIDv7;
  projectId: AssociationUUIDv7;
  status: string;
  url: string;
  intervalSeconds: number;
  timeoutSeconds: number;
  expectedResponseStatus: number;
  incidentDetectionFails: number;
  consecutivesIncidentDetectionFails: number;
  emailToAlert: string | null;
  enabled: boolean;
  createdAt: CreatedAt;
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
      id: new UUIDv7(),
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
      createdAt: new CreatedAt(),
    });
  }
}
