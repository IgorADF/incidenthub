import { DefaultEntity } from "./_default-class";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { URL } from "@domain/value-objects/url";
import { Email } from "@domain/value-objects/email";
import { OmitDefaultValues } from "~types/omit-default-values";

const ServiceSchema = z
  .object({
    id: UUIDv7,
    projectId: UUIDv7,
    name: z.string().min(1).max(50),
    status: z.string().min(1).max(50),
    url: URL,
    intervalSeconds: z.number().int().positive().min(5).max(99999),
    timeoutSeconds: z.number().int().positive().min(5).max(20),
    expectedResponseStatus: z.number().int().min(100).max(599),
    incidentDetectionFails: z.number().int().positive().max(99),
    consecutivesIncidentDetectionFails: z.number().int().min(0).max(99999),
    emailToAlert: Email.nullable(),
    enabled: z.boolean(),
    createdAt: CreatedAt,
  })
  .refine((data) => data.timeoutSeconds < data.intervalSeconds, {
    message: "timeoutSeconds must be smaller than intervalSeconds",
    path: ["timeoutSeconds"],
  });

type ServiceType = z.infer<typeof ServiceSchema>;

export type CreateServiceType = OmitDefaultValues<
  ServiceType,
  "status" | "consecutivesIncidentDetectionFails" | "enabled"
>;

export class Service extends DefaultEntity<ServiceType> {
  static create(props: CreateServiceType) {
    return Service.fromProps({
      ...props,
      status: "unknown",
      consecutivesIncidentDetectionFails: 0,
      enabled: true,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: ServiceType) {
    return new Service(props, ServiceSchema);
  }
}
