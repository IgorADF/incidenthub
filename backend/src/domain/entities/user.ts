import { DefaultEntity } from "./_default";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { HashedPassword } from "~types/hashed-password";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";

interface IUser {
  id: UUIDv7;
  organizationId: AssociationUUIDv7;
  email: string;
  password: HashedPassword;
  type: "ADMIN" | "DEV";
  createdAt: CreatedAt;
}

export class User extends DefaultEntity<IUser> {
  static create(
    props: Omit<IUser, "id" | "createdAt"> & { password: HashedPassword },
  ) {
    return new User({
      id: new UUIDv7(),
      organizationId: props.organizationId,
      email: props.email,
      password: props.password,
      type: props.type,
      createdAt: new CreatedAt(),
    });
  }
}
