import { UOW } from "../repositories/interfaces/_uow";
import { EntityAlreadyExists } from "./errors/EntityAlreadyExists";

export class Createorganization {
  constructor(private readonly uow: UOW) {}

  async execute(orgName: string) {
    const orgWithSameName =
      await this.uow.repositories.organizations.getByName(orgName);

    if (orgWithSameName) {
      throw new EntityAlreadyExists();
    }

    const newOrg = await this.uow.transaction(async (reps) => {
      return await reps.organizations.create({
        name: orgName,
      });
    });

    return newOrg;
  }
}
