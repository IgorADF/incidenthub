import { Organization } from "../../entities/organization";
import { OrganizationsRepInterface } from "../interfaces/organizations";
import { IMUOWdb } from "./_uow";

export class IMOrganizationsRep implements OrganizationsRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getByName(name: string) {
    const record = this.db.organizations.find(
      (org) => org.getProps().name === name,
    );
    return record ?? null;
  }

  async create(data: Organization) {
    this.db.organizations.push(data);
    return data;
  }
}
