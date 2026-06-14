import { User } from "../../entities/user";
import { UsersRepInterface } from "../interfaces/users";
import { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getByEmail(email: string) {
    const record = this.db.users.find((u) => u.getProps().email === email);
    return record ?? null;
  }

  async create(data: User) {
    this.db.users.push(data);
    return data;
  }
}
