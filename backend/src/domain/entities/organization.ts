import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { DefaultEntity } from "./_default";
import { CreatedAt } from "@domain/value-objects/created-at";

interface IOrganization {
  id: UUIDv7;
  name: string;
  createdAt: CreatedAt;
}

export class Organization extends DefaultEntity<IOrganization> {
  static create(props: Omit<IOrganization, "id" | "createdAt">) {
    return new Organization({
      id: new UUIDv7(),
      name: props.name,
      createdAt: new CreatedAt(),
    });
  }
}
