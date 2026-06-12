import { Organization } from "../../types/entities";
import { OrganizationsRepInterface } from "../interfaces/organizations";
import { IMUOWdb } from "./_uow";
import { createIMDefaultValues } from "../../utils/im-default-values";

export class IMOrganizationsRep implements OrganizationsRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getByName(name: string) {
    const sup = this.db.organizations.find((org) => org.name === name);
    return sup ?? null;
  }

  async create({ name }: { name: string }) {
    const newOrg: Organization = {
      name,
      ...createIMDefaultValues(),
    };

    this.db.organizations.push(newOrg);

    return newOrg;
  }
}
