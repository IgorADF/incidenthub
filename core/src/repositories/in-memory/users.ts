import { User } from "../../types/entities";
import { createIMDefaultValues } from "../../utils/im-default-values";
import { UsersRepInterface } from "../interfaces/users";
import { IMUOWdb } from "./_uow";

export class IMUsersRep implements UsersRepInterface {
  constructor(private readonly db: IMUOWdb) {}

  async getByEmail(email: string) {
    const user = this.db.users.find((u) => u.email === email);
    return user ?? null;
  }

  async create({
    organizationId,
    email,
    password,
    type,
  }: {
    organizationId: string;
    email: string;
    password: string;
    type: "ADMIN" | "DEV";
  }) {
    const newUser: User = {
      organizationId,
      email,
      password,
      type,
      deletedAt: null,
      ...createIMDefaultValues(),
    };

    this.db.users.push(newUser);

    return newUser;
  }
}
