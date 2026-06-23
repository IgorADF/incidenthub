import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { Url } from "@domain/value-objects/url";
import { Email } from "@domain/value-objects/email";
import { OmitDefaultValues } from "~types/omit-default-values";

const ServiceSchema = z
  .object({
    id: UUIDv7,
    projectId: UUIDv7,
    name: z.string().min(1).max(50),
    status: z.enum(["CHECKING", "INCIDENT", "DISABLED"]),
    url: Url,
    intervalSeconds: z.number().int().positive().min(5).max(9999),
    timeoutSeconds: z.number().int().positive().min(5).max(20),
    expectedResponseStatus: z.number().int().min(100).max(599),
    incidentDetectionFails: z.number().int().positive().max(99),
    consecutivesIncidentDetectionFails: z.number().int().min(0).max(99),
    emailToAlert: Email.nullable(),
    enabled: z.boolean(),
    currentIncidentId: UUIDv7.nullable(),
    lastCheckedAt: CreatedAt.nullable(),
    createdAt: CreatedAt,
  })
  .refine((data) => data.timeoutSeconds < data.intervalSeconds, {
    message: "timeoutSeconds must be smaller than intervalSeconds",
    path: ["timeoutSeconds"],
  });

export type ServiceType = z.infer<typeof ServiceSchema>;

export type CreateServiceType = OmitDefaultValues<
  ServiceType,
  | "status"
  | "consecutivesIncidentDetectionFails"
  | "enabled"
  | "currentIncidentId"
  | "lastCheckedAt"
>;

export class Service extends DefaultEntity<ServiceType> {
  static create(props: CreateServiceType) {
    return Service.fromProps({
      ...props,
      status: "CHECKING",
      consecutivesIncidentDetectionFails: 0,
      enabled: true,
      currentIncidentId: null,
      lastCheckedAt: null,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: ServiceType) {
    return new Service(props, ServiceSchema);
  }

  markChecking(): Service {
    return Service.fromProps({ ...this.getProps(), status: "CHECKING" });
  }

  recordSuccess(): Service {
    return Service.fromProps({
      ...this.getProps(),
      consecutivesIncidentDetectionFails: 0,
    });
  }

  recordFailure(): Service {
    const props = this.getProps();
    const nextFails = Math.min(
      props.consecutivesIncidentDetectionFails + 1,
      99,
    );
    return Service.fromProps({
      ...props,
      consecutivesIncidentDetectionFails: nextFails,
    });
  }

  markIncident(): Service {
    return Service.fromProps({ ...this.getProps(), status: "INCIDENT" });
  }

  disable(): Service {
    return Service.fromProps({
      ...this.getProps(),
      status: "DISABLED",
      enabled: false,
    });
  }

  enable(): Service {
    return Service.fromProps({
      ...this.getProps(),
      status: "CHECKING",
      enabled: true,
    });
  }

  markCheckedAt(date: Date): Service {
    return Service.fromProps({
      ...this.getProps(),
      lastCheckedAt: date,
    });
  }

  setCurrentIncident(incidentId: string): Service {
    return Service.fromProps({
      ...this.getProps(),
      currentIncidentId: incidentId,
    });
  }

  resolveCurrentIncident(): Service {
    return Service.fromProps({ ...this.getProps(), currentIncidentId: null });
  }
}
