import { DefaultEntity } from "./_default-class";
import z from "zod";
import { UUIDv7 } from "@domain/value-objects/uuidv7";
import { CreatedAt } from "@domain/value-objects/created-at";
import { Slug } from "@domain/value-objects/slug";
import { OmitDefaultValues } from "~types/omit-default-values";

const ProjectSchema = z
  .object({
    id: UUIDv7,
    organizationId: UUIDv7,
    name: z.string().min(1).max(50),
    showPublicPage: z.boolean(),
    publicPageSlug: Slug.nullable(),
    createdAt: CreatedAt,
  })
  .refine((data) => data.showPublicPage && !data.publicPageSlug, {
    message: "If showPublicPage is true, a valid publicPageSlug must exist",
    path: ["timeoutSeconds"],
  })
  .transform((values) => {
    if (!values.showPublicPage) {
      values.publicPageSlug = null;
    }

    return values;
  });

type ProjectType = z.infer<typeof ProjectSchema>;

export type CreateProjectType = OmitDefaultValues<ProjectType>;

export class Project extends DefaultEntity<ProjectType> {
  static create(props: CreateProjectType) {
    return Project.fromProps({
      ...props,
      ...DefaultEntity.generateEntityDefaultValues(),
    });
  }

  static fromProps(props: ProjectType) {
    return new Project(props, ProjectSchema);
  }
}
