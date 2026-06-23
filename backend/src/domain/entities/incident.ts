import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { OmitDefaultValues } from "~types/omit-default-values";

export const IncidentSchema = z.object({
  id: UUIDv7,
  serviceId: UUIDv7,
  startedAt: CreatedAt,
  resolvedAt: CreatedAt.nullable(),
  emailsSent: z.number().int().min(0),
  createdAt: CreatedAt,
});

type IncidentType = z.infer<typeof IncidentSchema>;

export type CreateIncidentType = OmitDefaultValues<
  IncidentType,
  "resolvedAt" | "emailsSent"
>;

export class Incident extends DefaultEntity<IncidentType> {
  static create(props: CreateIncidentType) {
    return Incident.fromProps({
      ...props,
      resolvedAt: null,
      emailsSent: 0,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: IncidentType) {
    return new Incident(props, IncidentSchema);
  }

  resolve(resolvedAt: Date): Incident {
    return Incident.fromProps({
      ...this.getProps(),
      resolvedAt,
    });
  }

  incrementEmailsSent(): Incident {
    return Incident.fromProps({
      ...this.getProps(),
      emailsSent: this.getProps().emailsSent + 1,
    });
  }
}
