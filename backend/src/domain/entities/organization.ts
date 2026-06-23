import { DefaultEntity } from "./_default";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { OmitDefaultValues } from "~types/omit-default-values";

export const OrganizationSchema = z.object({
  id: UUIDv7,
  name: z.string().min(1).max(50),
  createdAt: CreatedAt,
});

type OrganizationType = z.infer<typeof OrganizationSchema>;

export type CreateOrganizationType = OmitDefaultValues<OrganizationType>;

export class Organization extends DefaultEntity<OrganizationType> {
  static create(props: CreateOrganizationType) {
    return Organization.fromProps({
      ...props,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: OrganizationType) {
    return new Organization(props, OrganizationSchema);
  }
}
