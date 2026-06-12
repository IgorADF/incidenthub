import { Organization } from "../../types/entities";

export interface OrganizationsRepInterface {
  getByName: (name: string) => Promise<Organization | null>;
  create: (data: { name: string }) => Promise<Organization>;
}
