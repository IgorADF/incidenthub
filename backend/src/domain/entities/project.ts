import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { DefaultEntity } from "./_default";
import { CreatedAt } from "@domain/value-objects/created-at";
import { AssociationUUIDv7 } from "@domain/value-objects/association-uuidv7";

interface IProject {
  id: UUIDv7;
  organizationId: AssociationUUIDv7;
  name: string;
  showPublicPage: boolean;
  publicPageSlug: string | null;
  createdAt: CreatedAt;
}

export class Project extends DefaultEntity<IProject> {
  static create(props: Omit<IProject, "id" | "createdAt">) {
    return new Project({
      id: new UUIDv7(),
      organizationId: props.organizationId,
      name: props.name,
      showPublicPage: props.showPublicPage,
      publicPageSlug: props.publicPageSlug,
      createdAt: new CreatedAt(),
    });
  }
}
