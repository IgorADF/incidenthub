import { User } from "@domain/entities/user";
import { UsersRepInterface } from "@domain/repositories/interfaces/users";
import { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
  constructor(private readonly db: IMUOWdb) { }

  async getById(id: string) {
    const record = this.db.users.find((u) => u.getProps().id === id);
    return record ?? null;
  }

  async hasSameByEmail(email: string) {
    const record = this.db.users.find((u) => u.getProps().email === email);

    if (!record) {
      return false;
    }

    return record.getProps().email === email
  }

  async getByEmail(email: string) {
    const record = this.db.users.find((u) => u.getProps().email === email);

    if (!record) {
      return null;
    }

    return record
  }

  async getByEmailWithPassword(email: string) {
    const record = this.db.users.find((u) => u.getProps().email === email);

    if (!record) {
      return null;
    }

    return record ?? null;
  }

  async create(data: User) {
    this.db.users.push(data);
    return data;
  }
}
