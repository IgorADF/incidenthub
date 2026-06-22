import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { OmitDefaultValues } from "~types/omit-default-values";

const IncidentSchema = z.object({
  id: UUIDv7,
  serviceId: UUIDv7,
  startedAt: CreatedAt,
  resolvedAt: CreatedAt.nullable(),
  emailsSent: z.number().int().min(0),
  createdAt: CreatedAt,
});

type IncidentType = z.infer<typeof IncidentSchema>;

export type CreateIncidentType = OmitDefaultValues<IncidentType>;

export class Incident extends DefaultEntity<IncidentType> {
  static create(props: CreateIncidentType) {
    return Incident.fromProps({
      ...props,
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
