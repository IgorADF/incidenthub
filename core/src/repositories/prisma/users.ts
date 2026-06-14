import { User } from "../../entities/user";
import { TPrismaClient } from "../../types/prisma-client";
import { UsersRepInterface } from "../interfaces/users";

export class PrismaUsersRep implements UsersRepInterface {
  constructor(private readonly prisma: TPrismaClient) {}

  async getByEmail(email: string) {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? User.fromPrismaToEntity(record) : null;
  }

  async create(data: User) {
    const record = await this.prisma.user.create({
      data: User.fromEntityToPrisma(data),
    });
    return User.fromPrismaToEntity(record);
  }
}
