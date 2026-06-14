import { Organization } from "../../entities/organization";

export interface OrganizationsRepInterface {
  getByName: (name: string) => Promise<Organization | null>;
  create: (data: Organization) => Promise<Organization>;
}
