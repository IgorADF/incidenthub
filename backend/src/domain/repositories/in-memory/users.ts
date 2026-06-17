import { User } from "@domain/entities/user";
import { UsersRepInterface } from "@domain/repositories/interfaces/users";
import { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getById(id: string) {
    const record = this.db.users.find((u) => u.getProps().id.value === id);
    return record ?? null;
  }

  async getByEmail(email: string) {
    const record = this.db.users.find((u) => u.getProps().email === email);
    return record ?? null;
  }

  async create(data: User) {
    this.db.users.push(data);
    return data;
  }
}
